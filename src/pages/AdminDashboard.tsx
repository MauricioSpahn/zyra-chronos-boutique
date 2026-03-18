import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Package, FolderOpen, Plus, Trash2, Pencil, Home, ShoppingBag, Search, Eye } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  reference: string;
  units_available: number;
  category_id: string | null;
  image_url: string;
  description: string;
  specs: Record<string, string>;
  gallery: string[];
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  city: string;
  state: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

type Tab = "products" | "categories" | "homepage" | "orders";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  const [prodGallery, setProdGallery] = useState("");
  const [prodSpecs, setProdSpecs] = useState("");

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

  useEffect(() => {
    checkAdmin();
    fetchData();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (tab === "orders") fetchOrders();
  }, [tab]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) { navigate("/admin/login"); }
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
        if (row.key === "hero") {
          setHeroTitle(val.title || "");
          setHeroSubtitle(val.subtitle || "");
          setHeroButton(val.buttonText || "");
        }
        if (row.key === "brand") {
          setBrandTagline(val.tagline || "");
          setBrandFooter(val.footer_text || "");
        }
      }
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Error al cargar pedidos"); }
    else setOrders((data as Order[]) || []);
    setOrdersLoading(false);
  };

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    setOrderItems((data as OrderItem[]) || []);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Estado actualizado a "${STATUS_LABELS[status]}"`);
    fetchOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, status } : null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !orderSearch ||
      o.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = !orderStatusFilter || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const saveHomepage = async () => {
    setSavingHome(true);
    const heroPayload = { title: heroTitle, subtitle: heroSubtitle, buttonText: heroButton };
    const brandPayload = { tagline: brandTagline, footer_text: brandFooter };

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("site_settings").update({ value: heroPayload as any, updated_at: new Date().toISOString() }).eq("key", "hero"),
      supabase.from("site_settings").update({ value: brandPayload as any, updated_at: new Date().toISOString() }).eq("key", "brand"),
    ]);

    if (e1 || e2) toast.error("Error al guardar");
    else toast.success("Página de inicio actualizada");
    setSavingHome(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setCatName(""); setCatSlug("");
    setProdName(""); setProdSlug(""); setProdPrice(""); setProdRef("");
    setProdUnits(""); setProdCatId(""); setProdDesc(""); setProdImage("");
    setProdGallery(""); setProdSpecs("");
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // CATEGORY CRUD
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

  // PRODUCT CRUD
  const saveProduct = async () => {
    const slug = prodSlug || slugify(prodName);
    let specs: Record<string, string> = {};
    let gallery: string[] = [];
    try { specs = prodSpecs ? JSON.parse(prodSpecs) : {}; } catch { toast.error("Specs JSON inválido"); return; }
    try { gallery = prodGallery ? JSON.parse(prodGallery) : []; } catch { toast.error("Gallery JSON inválido"); return; }

    const payload = {
      name: prodName, slug, price: Number(prodPrice), reference: prodRef,
      units_available: Number(prodUnits) || 0, category_id: prodCatId || null,
      description: prodDesc, image_url: prodImage, specs, gallery,
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
    setProdGallery(JSON.stringify(p.gallery));
    setProdSpecs(JSON.stringify(p.specs, null, 2)); setShowForm(true);
  };

  const inputClass = "w-full h-10 px-3 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/[0.08] px-6 md:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="font-mono text-lg tracking-[0.3em] font-semibold text-foreground">ZYRA</Link>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Admin</span>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="px-6 md:px-12 py-8">
        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-foreground/[0.08] overflow-x-auto">
          {[
            { key: "products" as Tab, icon: Package, label: "Productos" },
            { key: "categories" as Tab, icon: FolderOpen, label: "Categorías" },
            { key: "orders" as Tab, icon: ShoppingBag, label: "Pedidos" },
            { key: "homepage" as Tab, icon: Home, label: "Inicio" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); resetForm(); setSelectedOrder(null); }}
              className={`pb-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors border-b-2 whitespace-nowrap ${tab === key ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} className="inline mr-2" />{label}
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {tab === "orders" && (
          selectedOrder ? (
            <div className="max-w-3xl">
              <button
                onClick={() => setSelectedOrder(null)}
                className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Volver a pedidos
              </button>

              <div className="border border-foreground/[0.08] p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-lg text-foreground">{selectedOrder.order_number}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {new Date(selectedOrder.created_at).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className={inputClass + " !w-auto"}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Cliente</p>
                    <p className="font-sans text-sm text-foreground">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                    <p className="font-sans text-sm text-muted-foreground">{selectedOrder.email}</p>
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
                      <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.08] last:border-b-0">
                        <div>
                          <p className="font-sans text-sm text-foreground">{item.product_name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="font-mono text-sm tabular-nums text-foreground">${item.subtotal.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="text-right space-y-1">
                    <p className="font-sans text-sm text-muted-foreground">
                      Subtotal: <span className="font-mono tabular-nums text-foreground">${selectedOrder.subtotal.toLocaleString()}</span>
                    </p>
                    <p className="font-sans text-sm text-muted-foreground">
                      Envío: <span className="font-mono tabular-nums text-foreground">${selectedOrder.shipping_cost.toLocaleString()}</span>
                    </p>
                    <p className="font-mono text-lg text-foreground tabular-nums">
                      Total: ${selectedOrder.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar por número, email o nombre..."
                    className={inputClass + " !pl-9"}
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className={inputClass + " !w-auto"}
                >
                  <option value="">Todos los estados</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {ordersLoading ? (
                <p className="font-sans text-sm text-muted-foreground">Cargando pedidos...</p>
              ) : filteredOrders.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground">No se encontraron pedidos.</p>
              ) : (
                <div className="border border-foreground/[0.08]">
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
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                      <div>
                        <span className="font-sans text-sm text-foreground">{order.first_name} {order.last_name}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">{order.email}</span>
                      </div>
                      <span className="font-mono text-sm tabular-nums text-foreground">${order.total.toLocaleString()}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${
                        order.status === "delivered" ? "text-accent" :
                        order.status === "cancelled" ? "text-destructive" :
                        "text-muted-foreground"
                      }`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  ))}
                </div>
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
                <div>
                  <label className="block font-sans text-xs text-muted-foreground mb-1">Título principal</label>
                  <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={inputClass} placeholder="Precisión sin ornamento" />
                </div>
                <div>
                  <label className="block font-sans text-xs text-muted-foreground mb-1">Subtítulo</label>
                  <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} className={`${inputClass} h-auto py-2`} placeholder="Descripción del hero..." />
                </div>
                <div>
                  <label className="block font-sans text-xs text-muted-foreground mb-1">Texto del botón</label>
                  <input value={heroButton} onChange={(e) => setHeroButton(e.target.value)} className={inputClass} placeholder="Explorar colección" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Marca</p>
              <div className="space-y-3">
                <div>
                  <label className="block font-sans text-xs text-muted-foreground mb-1">Tagline</label>
                  <input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} className={inputClass} placeholder="Relojería esencial" />
                </div>
                <div>
                  <label className="block font-sans text-xs text-muted-foreground mb-1">Texto footer</label>
                  <input value={brandFooter} onChange={(e) => setBrandFooter(e.target.value)} className={inputClass} placeholder="Manufactura independiente..." />
                </div>
              </div>
            </div>

            <button
              onClick={saveHomepage}
              disabled={savingHome}
              className="h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150 disabled:opacity-50"
            >
              {savingHome ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}

        {/* PRODUCTS/CATEGORIES TABS */}
        {(tab === "products" || tab === "categories") && (
          <>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mb-6 h-10 px-6 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150 inline-flex items-center gap-2"
            >
              <Plus size={14} /> {tab === "products" ? "Nuevo producto" : "Nueva categoría"}
            </button>

            {showForm && (
              <div className="mb-8 p-6 border border-foreground/[0.08] bg-secondary/30 space-y-4 max-w-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {editingId ? "Editar" : "Crear"} {tab === "products" ? "producto" : "categoría"}
                </p>

                {tab === "categories" ? (
                  <>
                    <input placeholder="Nombre" value={catName} onChange={(e) => setCatName(e.target.value)} className={inputClass} />
                    <input placeholder="Slug (auto)" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className={inputClass} />
                    <div className="flex gap-3">
                      <button onClick={saveCategory} className="h-10 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors">Guardar</button>
                      <button onClick={resetForm} className="h-10 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors">Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input placeholder="Nombre" value={prodName} onChange={(e) => setProdName(e.target.value)} className={inputClass} />
                    <input placeholder="Slug (auto)" value={prodSlug} onChange={(e) => setProdSlug(e.target.value)} className={inputClass} />
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="Precio" type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className={inputClass} />
                      <input placeholder="Referencia" value={prodRef} onChange={(e) => setProdRef(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="Unidades" type="number" value={prodUnits} onChange={(e) => setProdUnits(e.target.value)} className={inputClass} />
                      <select value={prodCatId} onChange={(e) => setProdCatId(e.target.value)} className={inputClass}>
                        <option value="">Sin categoría</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <input placeholder="URL imagen principal" value={prodImage} onChange={(e) => setProdImage(e.target.value)} className={inputClass} />
                    <textarea placeholder="Descripción" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className={`${inputClass} h-auto py-2`} />
                    <textarea placeholder='Galería JSON: ["url1","url2"]' value={prodGallery} onChange={(e) => setProdGallery(e.target.value)} rows={2} className={`${inputClass} h-auto py-2`} />
                    <textarea placeholder='Specs JSON: {"diameter":"40mm",...}' value={prodSpecs} onChange={(e) => setProdSpecs(e.target.value)} rows={4} className={`${inputClass} h-auto py-2 font-mono text-xs`} />
                    <div className="flex gap-3">
                      <button onClick={saveProduct} className="h-10 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors">Guardar</button>
                      <button onClick={resetForm} className="h-10 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors">Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {loading ? (
              <p className="font-sans text-sm text-muted-foreground">Cargando...</p>
            ) : tab === "categories" ? (
              <div className="border border-foreground/[0.08]">
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
                      <button onClick={() => editCategory(cat)} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => deleteCategory(cat.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-foreground/[0.08]">
                <div className="grid grid-cols-[1fr_80px_80px_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] bg-secondary/30">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Producto</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Precio</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Uds.</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Acciones</span>
                </div>
                {products.length === 0 ? (
                  <p className="px-4 py-6 font-sans text-sm text-muted-foreground">Sin productos</p>
                ) : products.map((prod) => (
                  <div key={prod.id} className="grid grid-cols-[1fr_80px_80px_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] last:border-b-0 items-center">
                    <div>
                      <span className="font-sans text-sm text-foreground">{prod.name}</span>
                      <span className="block font-mono text-[10px] text-muted-foreground">{prod.reference}</span>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-foreground">${prod.price}</span>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">{prod.units_available}</span>
                    <div className="flex gap-2">
                      <button onClick={() => editProduct(prod)} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => deleteProduct(prod.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
