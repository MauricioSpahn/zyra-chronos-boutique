import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Package, FolderOpen, Plus, Trash2, Pencil, Home, ShoppingBag, Search, Eye, Upload, X, Image, Menu, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string; slug: string; }
interface Product {
  id: string; name: string; slug: string; price: number; reference: string;
  units_available: number; category_id: string | null; image_url: string;
  description: string; specs: Record<string, string>; gallery: string[];
}
interface Order {
  id: string; order_number: string; status: string; email: string;
  first_name: string; last_name: string; phone: string | null;
  payment_method: string; payment_status: string; subtotal: number;
  shipping_cost: number; total: number; city: string; state: string;
  created_at: string;
}
interface OrderItem { id: string; product_name: string; price: number; quantity: number; subtotal: number; }

type Tab = "products" | "categories" | "homepage" | "orders";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmado", shipped: "Enviado",
  delivered: "Entregado", cancelled: "Cancelado",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Category form
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");

  // Product form
  const [prodName, setProdName] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodRef, setProdRef] = useState("");
  const [prodUnits, setProdUnits] = useState("");
  const [prodCatId, setProdCatId] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodGallery, setProdGallery] = useState<string[]>([]);
  const [prodSpecs, setProdSpecs] = useState("");
  const [uploading, setUploading] = useState(false);

  // Homepage settings
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroButton, setHeroButton] = useState("");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandFooter, setBrandFooter] = useState("");
  const [savingHome, setSavingHome] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAdmin(); fetchData(); fetchSettings(); }, []);
  useEffect(() => { if (tab === "orders") fetchOrders(); }, [tab]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) navigate("/admin/login");
  };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);
    setCategories((cats as Category[]) || []);
    setProducts((prods as Product[]) || []);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      for (const row of data) {
        const val = row.value as Record<string, string>;
        if (row.key === "hero") { setHeroTitle(val.title || ""); setHeroSubtitle(val.subtitle || ""); setHeroButton(val.buttonText || ""); }
        if (row.key === "brand") { setBrandTagline(val.tagline || ""); setBrandFooter(val.footer_text || ""); }
      }
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Error al cargar pedidos");
    else setOrders((data as Order[]) || []);
    setOrdersLoading(false);
  };

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems((data as OrderItem[]) || []);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Estado actualizado a "${STATUS_LABELS[status]}"`);
    fetchOrders();
    if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status } : null);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = !orderSearch ||
      o.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesSearch && (!orderStatusFilter || o.status === orderStatusFilter);
  });

  // Image upload
  const uploadImage = async (file: File, folder = "main"): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error(`Error subiendo imagen: ${error.message}`); return null; }
    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
    return publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, "main");
    if (url) setProdImage(url);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, "gallery");
      if (url) urls.push(url);
    }
    setProdGallery((prev) => [...prev, ...urls]);
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setProdGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const saveHomepage = async () => {
    setSavingHome(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("site_settings").update({ value: { title: heroTitle, subtitle: heroSubtitle, buttonText: heroButton } as any, updated_at: new Date().toISOString() }).eq("key", "hero"),
      supabase.from("site_settings").update({ value: { tagline: brandTagline, footer_text: brandFooter } as any, updated_at: new Date().toISOString() }).eq("key", "brand"),
    ]);
    if (e1 || e2) toast.error("Error al guardar");
    else toast.success("Página de inicio actualizada");
    setSavingHome(false);
  };

  const logout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setCatName(""); setCatSlug("");
    setProdName(""); setProdSlug(""); setProdPrice(""); setProdRef("");
    setProdUnits(""); setProdCatId(""); setProdDesc(""); setProdImage("");
    setProdGallery([]); setProdSpecs("");
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const saveCategory = async () => {
    const slug = catSlug || slugify(catName);
    if (editingId) {
      const { error } = await supabase.from("categories").update({ name: catName, slug }).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoría actualizada");
    } else {
      const { error } = await supabase.from("categories").insert({ name: catName, slug });
      if (error) { toast.error(error.message); return; }
      toast.success("Categoría creada");
    }
    resetForm(); fetchData();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Categoría eliminada"); fetchData();
  };

  const editCategory = (cat: Category) => {
    setEditingId(cat.id); setCatName(cat.name); setCatSlug(cat.slug); setShowForm(true);
  };

  const saveProduct = async () => {
    const slug = prodSlug || slugify(prodName);
    let specs: Record<string, string> = {};
    try { specs = prodSpecs ? JSON.parse(prodSpecs) : {}; } catch { toast.error("Specs JSON inválido"); return; }

    const payload = {
      name: prodName, slug, price: Number(prodPrice), reference: prodRef,
      units_available: Number(prodUnits) || 0, category_id: prodCatId || null,
      description: prodDesc, image_url: prodImage, specs, gallery: prodGallery,
    };

    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Producto actualizado");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Producto creado");
    }
    resetForm(); fetchData();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Producto eliminado"); fetchData();
  };

  const editProduct = (p: Product) => {
    setEditingId(p.id); setProdName(p.name); setProdSlug(p.slug);
    setProdPrice(String(p.price)); setProdRef(p.reference);
    setProdUnits(String(p.units_available)); setProdCatId(p.category_id || "");
    setProdDesc(p.description); setProdImage(p.image_url);
    setProdGallery(Array.isArray(p.gallery) ? p.gallery : []);
    setProdSpecs(JSON.stringify(p.specs, null, 2)); setShowForm(true);
  };

  const inputClass = "w-full h-12 px-3 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent rounded-none";

  const tabs = [
    { key: "products" as Tab, icon: Package, label: "Productos" },
    { key: "categories" as Tab, icon: FolderOpen, label: "Categorías" },
    { key: "orders" as Tab, icon: ShoppingBag, label: "Pedidos" },
    { key: "homepage" as Tab, icon: Home, label: "Inicio" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/[0.08] px-4 md:px-12 h-14 md:h-16 flex items-center justify-between sticky top-0 z-30 bg-background">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
          <Link to="/" className="font-mono text-base md:text-lg tracking-[0.3em] font-semibold text-foreground">ZYRA</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent hidden sm:inline">Admin</span>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Mobile tabs overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-14">
          <nav className="p-6 space-y-2">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); resetForm(); setSelectedOrder(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-4 font-mono text-sm uppercase tracking-[0.15em] transition-colors ${tab === key ? "text-accent bg-accent/5" : "text-muted-foreground"}`}
              >
                <Icon size={18} />{label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="px-4 md:px-12 py-6 md:py-8">
        {/* Desktop tabs */}
        <div className="hidden md:flex gap-6 mb-8 border-b border-foreground/[0.08] overflow-x-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); resetForm(); setSelectedOrder(null); }}
              className={`pb-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors border-b-2 whitespace-nowrap ${tab === key ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} className="inline mr-2" />{label}
            </button>
          ))}
        </div>

        {/* Mobile current tab label */}
        <div className="md:hidden mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            {tabs.find((t) => t.key === tab)?.label}
          </p>
        </div>

        {/* ORDERS TAB */}
        {tab === "orders" && (
          selectedOrder ? (
            <div className="max-w-3xl">
              <button onClick={() => setSelectedOrder(null)} className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                <ChevronLeft size={14} /> Volver a pedidos
              </button>
              <div className="border border-foreground/[0.08] p-4 md:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="font-mono text-base md:text-lg text-foreground">{selectedOrder.order_number}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">{new Date(selectedOrder.created_at).toLocaleString("es-MX")}</p>
                  </div>
                  <select value={selectedOrder.status} onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)} className={inputClass + " !w-full sm:!w-auto"}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Cliente</p>
                    <p className="font-sans text-sm text-foreground">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                    <p className="font-sans text-sm text-muted-foreground break-all">{selectedOrder.email}</p>
                    {selectedOrder.phone && <p className="font-sans text-sm text-muted-foreground">{selectedOrder.phone}</p>}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Envío</p>
                    <p className="font-sans text-sm text-foreground">{selectedOrder.city}, {selectedOrder.state}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      Método: {selectedOrder.payment_method === "mercadopago" ? "Mercado Pago" : "Tarjeta"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Productos</p>
                  <div className="border border-foreground/[0.08]">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-foreground/[0.08] last:border-b-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-sm text-foreground truncate">{item.product_name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="font-mono text-sm tabular-nums text-foreground ml-3">${item.subtotal.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-right space-y-1">
                    <p className="font-sans text-sm text-muted-foreground">Subtotal: <span className="font-mono tabular-nums text-foreground">${selectedOrder.subtotal.toLocaleString()}</span></p>
                    <p className="font-sans text-sm text-muted-foreground">Envío: <span className="font-mono tabular-nums text-foreground">${selectedOrder.shipping_cost.toLocaleString()}</span></p>
                    <p className="font-mono text-lg text-foreground tabular-nums">Total: ${selectedOrder.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Buscar pedido..." className={inputClass + " !pl-9"} />
                </div>
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className={inputClass + " sm:!w-48"}>
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              {ordersLoading ? (
                <p className="font-sans text-sm text-muted-foreground">Cargando...</p>
              ) : filteredOrders.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground">No se encontraron pedidos.</p>
              ) : (
                /* Mobile: card layout / Desktop: table */
                <>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {filteredOrders.map((order) => (
                      <button key={order.id} onClick={() => viewOrderDetails(order)} className="w-full text-left p-4 border border-foreground/[0.08] bg-secondary/20 space-y-2 active:bg-secondary/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-foreground">{order.order_number}</span>
                          <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${order.status === "delivered" ? "text-accent" : order.status === "cancelled" ? "text-destructive" : "text-muted-foreground"}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <p className="font-sans text-sm text-foreground">{order.first_name} {order.last_name}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("es-MX")}</span>
                          <span className="font-mono text-sm tabular-nums text-foreground">${order.total.toLocaleString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Desktop table */}
                  <div className="hidden md:block border border-foreground/[0.08]">
                    <div className="grid grid-cols-[1fr_1fr_100px_100px_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] bg-secondary/30">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Pedido</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cliente</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Estado</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ver</span>
                    </div>
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="grid grid-cols-[1fr_1fr_100px_100px_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] last:border-b-0 items-center">
                        <div>
                          <span className="font-mono text-xs text-foreground">{order.order_number}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("es-MX")}</span>
                        </div>
                        <div>
                          <span className="font-sans text-sm text-foreground">{order.first_name} {order.last_name}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">{order.email}</span>
                        </div>
                        <span className="font-mono text-sm tabular-nums text-foreground">${order.total.toLocaleString()}</span>
                        <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${order.status === "delivered" ? "text-accent" : order.status === "cancelled" ? "text-destructive" : "text-muted-foreground"}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <button onClick={() => viewOrderDetails(order)} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )
        )}

        {/* HOMEPAGE TAB */}
        {tab === "homepage" && (
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sección Hero</p>
              <div className="space-y-3">
                <div><label className="block font-sans text-xs text-muted-foreground mb-1">Título principal</label><input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={inputClass} /></div>
                <div><label className="block font-sans text-xs text-muted-foreground mb-1">Subtítulo</label><textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} className={`${inputClass} h-auto py-3`} /></div>
                <div><label className="block font-sans text-xs text-muted-foreground mb-1">Texto del botón</label><input value={heroButton} onChange={(e) => setHeroButton(e.target.value)} className={inputClass} /></div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Marca</p>
              <div className="space-y-3">
                <div><label className="block font-sans text-xs text-muted-foreground mb-1">Tagline</label><input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} className={inputClass} /></div>
                <div><label className="block font-sans text-xs text-muted-foreground mb-1">Texto footer</label><input value={brandFooter} onChange={(e) => setBrandFooter(e.target.value)} className={inputClass} /></div>
              </div>
            </div>
            <button onClick={saveHomepage} disabled={savingHome} className="w-full sm:w-auto h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
              {savingHome ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}

        {/* PRODUCTS/CATEGORIES TABS */}
        {(tab === "products" || tab === "categories") && (
          <>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="mb-6 w-full sm:w-auto h-12 px-6 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors inline-flex items-center justify-center gap-2">
              <Plus size={14} /> {tab === "products" ? "Nuevo producto" : "Nueva categoría"}
            </button>

            {showForm && (
              <div className="mb-8 p-4 md:p-6 border border-foreground/[0.08] bg-secondary/30 space-y-4 max-w-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {editingId ? "Editar" : "Crear"} {tab === "products" ? "producto" : "categoría"}
                </p>

                {tab === "categories" ? (
                  <>
                    <input placeholder="Nombre" value={catName} onChange={(e) => setCatName(e.target.value)} className={inputClass} />
                    <input placeholder="Slug (auto)" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className={inputClass} />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={saveCategory} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors flex-1 sm:flex-none">Guardar</button>
                      <button onClick={resetForm} className="h-12 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors flex-1 sm:flex-none">Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input placeholder="Nombre" value={prodName} onChange={(e) => setProdName(e.target.value)} className={inputClass} />
                    <input placeholder="Slug (auto)" value={prodSlug} onChange={(e) => setProdSlug(e.target.value)} className={inputClass} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input placeholder="Precio" type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className={inputClass} />
                      <input placeholder="Referencia" value={prodRef} onChange={(e) => setProdRef(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input placeholder="Unidades" type="number" value={prodUnits} onChange={(e) => setProdUnits(e.target.value)} className={inputClass} />
                      <select value={prodCatId} onChange={(e) => setProdCatId(e.target.value)} className={inputClass}>
                        <option value="">Sin categoría</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Image upload */}
                    <div className="space-y-2">
                      <label className="block font-sans text-xs text-muted-foreground">Imagen principal</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-12 px-4 border border-dashed border-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors flex items-center justify-center gap-2 font-sans text-xs flex-1 sm:flex-none">
                          <Upload size={14} /> {uploading ? "Subiendo..." : "Subir imagen"}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                        {prodImage && (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img src={prodImage} alt="Preview" className="w-12 h-12 object-cover bg-secondary flex-shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground truncate flex-1">{prodImage.split("/").pop()}</span>
                            <button onClick={() => setProdImage("")} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"><X size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gallery upload */}
                    <div className="space-y-2">
                      <label className="block font-sans text-xs text-muted-foreground">Galería</label>
                      <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading} className="w-full h-12 px-4 border border-dashed border-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors flex items-center justify-center gap-2 font-sans text-xs">
                        <Image size={14} /> {uploading ? "Subiendo..." : "Agregar imágenes a la galería"}
                      </button>
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                      {prodGallery.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {prodGallery.map((url, i) => (
                            <div key={i} className="relative group aspect-square bg-secondary overflow-hidden">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-background/80 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea placeholder="Descripción" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className={`${inputClass} h-auto py-3`} />
                    <textarea placeholder='Specs JSON: {"diameter":"40mm",...}' value={prodSpecs} onChange={(e) => setProdSpecs(e.target.value)} rows={4} className={`${inputClass} h-auto py-3 font-mono text-xs`} />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={saveProduct} disabled={uploading} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 flex-1 sm:flex-none">Guardar</button>
                      <button onClick={resetForm} className="h-12 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors flex-1 sm:flex-none">Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {loading ? (
              <p className="font-sans text-sm text-muted-foreground">Cargando...</p>
            ) : tab === "categories" ? (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {categories.length === 0 ? (
                    <p className="font-sans text-sm text-muted-foreground">Sin categorías</p>
                  ) : categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-4 border border-foreground/[0.08]">
                      <div><p className="font-sans text-sm text-foreground">{cat.name}</p><p className="font-mono text-[10px] text-muted-foreground">{cat.slug}</p></div>
                      <div className="flex gap-1">
                        <button onClick={() => editCategory(cat)} className="p-3 text-muted-foreground hover:text-foreground"><Pencil size={16} /></button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-3 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden md:block border border-foreground/[0.08]">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] bg-secondary/30">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nombre</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Slug</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Acciones</span>
                  </div>
                  {categories.length === 0 ? (
                    <p className="px-4 py-6 font-sans text-sm text-muted-foreground">Sin categorías</p>
                  ) : categories.map((cat) => (
                    <div key={cat.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] last:border-b-0 items-center">
                      <span className="font-sans text-sm text-foreground">{cat.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{cat.slug}</span>
                      <div className="flex gap-2">
                        <button onClick={() => editCategory(cat)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {products.length === 0 ? (
                    <p className="font-sans text-sm text-muted-foreground">Sin productos</p>
                  ) : products.map((prod) => (
                    <div key={prod.id} className="flex items-center gap-3 p-3 border border-foreground/[0.08]">
                      {prod.image_url && <img src={prod.image_url} alt="" className="w-14 h-14 object-cover bg-secondary flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-foreground truncate">{prod.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{prod.reference} · ${prod.price.toLocaleString()} · {prod.units_available} uds.</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => editProduct(prod)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={16} /></button>
                        <button onClick={() => deleteProduct(prod.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden md:block border border-foreground/[0.08]">
                  <div className="grid grid-cols-[auto_1fr_80px_80px_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] bg-secondary/30">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground w-12"></span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Producto</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Precio</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Uds.</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Acciones</span>
                  </div>
                  {products.length === 0 ? (
                    <p className="px-4 py-6 font-sans text-sm text-muted-foreground">Sin productos</p>
                  ) : products.map((prod) => (
                    <div key={prod.id} className="grid grid-cols-[auto_1fr_80px_80px_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] last:border-b-0 items-center">
                      <div className="w-12 h-12 bg-secondary overflow-hidden flex-shrink-0">
                        {prod.image_url && <img src={prod.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <span className="font-sans text-sm text-foreground">{prod.name}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">{prod.reference}</span>
                      </div>
                      <span className="font-mono text-sm tabular-nums text-foreground">${prod.price}</span>
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">{prod.units_available}</span>
                      <div className="flex gap-2">
                        <button onClick={() => editProduct(prod)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                        <button onClick={() => deleteProduct(prod.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
