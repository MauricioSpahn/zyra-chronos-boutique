import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Package, FolderOpen, Plus, Trash2, Pencil, Home, ShoppingBag, Menu, BarChart3, Upload, X, Image, Settings, History, Phone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import AdminHeroSlides from "@/components/admin/AdminHeroSlides";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminOrdersDB from "@/components/admin/AdminOrdersDB";
import AdminAccount from "@/components/admin/AdminAccount";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminContact from "@/components/admin/AdminContact";

interface Category { id: string; name: string; slug: string; parent_id: string | null; }
interface Product {
  id: string; name: string; slug: string; price: number; reference: string;
  units_available: number; category_id: string | null; image_url: string;
  description: string; specs: Record<string, string>; gallery: string[];
  currency: string;
}

type Tab = "analytics" | "products" | "categories" | "orders" | "homepage" | "account" | "audit" | "contact";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("analytics");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState("");
  const [adminName, setAdminName] = useState("");

  // Category form
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catParentId, setCatParentId] = useState("");

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
  const [prodCurrency, setProdCurrency] = useState("USD");
  const [uploading, setUploading] = useState(false);

  // Drag states
  const [dragOverMain, setDragOverMain] = useState(false);
  const [dragOverGallery, setDragOverGallery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAdmin(); fetchData(); }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) { navigate("/admin/login"); return; }
    setAdminUserId(user.id);
    const { data: profile } = await supabase.from("admin_profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (profile) {
      setAdminName(`${(profile as any).first_name || ""} ${(profile as any).last_name || ""}`.trim());
    } else {
      setAdminName(user.email || "Admin");
    }
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

  const logout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setCatName(""); setCatSlug(""); setCatParentId("");
    setProdName(""); setProdSlug(""); setProdPrice(""); setProdRef("");
    setProdUnits(""); setProdCatId(""); setProdDesc(""); setProdImage("");
    setProdGallery([]); setProdSpecs(""); setProdCurrency("USD");
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const logAudit = async (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => {
    await supabase.from("audit_log").insert({
      admin_user_id: adminUserId,
      admin_name: adminName || "Admin",
      action, entity_type: entityType,
      entity_id: entityId || null,
      details: details || {},
    } as any);
  };

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
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, "gallery");
      if (url) setProdGallery((prev) => [...prev, url]);
    }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleFileDrop = useCallback(async (files: FileList, target: "main" | "gallery") => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    setUploading(true);
    if (target === "main") {
      const url = await uploadImage(imageFiles[0], "main");
      if (url) setProdImage(url);
    } else {
      for (const file of imageFiles) {
        const url = await uploadImage(file, "gallery");
        if (url) setProdGallery((prev) => [...prev, url]);
      }
    }
    setUploading(false);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const removeGalleryImage = (index: number) => setProdGallery((prev) => prev.filter((_, i) => i !== index));

  // Categories helpers
  const getRootCategories = () => categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);
  const getCategoryLabel = (cat: Category): string => {
    if (cat.parent_id) {
      const parent = categories.find(c => c.id === cat.parent_id);
      return parent ? `${parent.name} → ${cat.name}` : cat.name;
    }
    return cat.name;
  };

  // CRUD Categories
  const saveCategory = async () => {
    const slug = catSlug || slugify(catName);
    const payload: any = { name: catName, slug, parent_id: catParentId || null };
    if (editingId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      await logAudit("update_category", "category", editingId, { name: catName });
      toast.success("Categoría actualizada");
    } else {
      const { data, error } = await supabase.from("categories").insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      await logAudit("create_category", "category", data?.id, { name: catName });
      toast.success("Categoría creada");
    }
    resetForm(); fetchData();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAudit("delete_category", "category", id);
    toast.success("Categoría eliminada"); fetchData();
  };

  const editCategory = (cat: Category) => {
    setEditingId(cat.id); setCatName(cat.name); setCatSlug(cat.slug);
    setCatParentId(cat.parent_id || ""); setShowForm(true);
  };

  // CRUD Products
  const saveProduct = async () => {
    const slug = prodSlug || slugify(prodName);
    let specs: Record<string, string> = {};
    try { specs = prodSpecs ? JSON.parse(prodSpecs) : {}; } catch { toast.error("Specs JSON inválido"); return; }
    const payload = {
      name: prodName, slug, price: Number(prodPrice), reference: prodRef,
      units_available: Number(prodUnits) || 0, category_id: prodCatId || null,
      description: prodDesc, image_url: prodImage, specs, gallery: prodGallery,
      currency: prodCurrency,
    };
    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      await logAudit("update_product", "product", editingId, { name: prodName });
      toast.success("Producto actualizado");
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      await logAudit("create_product", "product", data?.id, { name: prodName });
      toast.success("Producto creado");
    }
    resetForm(); fetchData();
  };

  const deleteProduct = async (id: string) => {
    const prod = products.find(p => p.id === id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAudit("delete_product", "product", id, { name: prod?.name });
    toast.success("Producto eliminado"); fetchData();
  };

  const editProduct = (p: Product) => {
    setEditingId(p.id); setProdName(p.name); setProdSlug(p.slug);
    setProdPrice(String(p.price)); setProdRef(p.reference);
    setProdUnits(String(p.units_available)); setProdCatId(p.category_id || "");
    setProdDesc(p.description); setProdImage(p.image_url);
    setProdGallery(Array.isArray(p.gallery) ? p.gallery : []);
    setProdSpecs(JSON.stringify(p.specs, null, 2)); setProdCurrency(p.currency || "USD"); setShowForm(true);
  };

  const inputClass = "w-full h-12 px-3 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent rounded-none";

  const tabs = [
    { key: "analytics" as Tab, icon: BarChart3, label: "Analíticas" },
    { key: "orders" as Tab, icon: ShoppingBag, label: "Pedidos" },
    { key: "products" as Tab, icon: Package, label: "Productos" },
    { key: "categories" as Tab, icon: FolderOpen, label: "Categorías" },
    { key: "homepage" as Tab, icon: Home, label: "Inicio" },
    { key: "contact" as Tab, icon: Phone, label: "Contacto" },
    { key: "audit" as Tab, icon: History, label: "Registro" },
    { key: "account" as Tab, icon: Settings, label: "Cuenta" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/[0.08] px-4 md:px-12 h-14 md:h-16 flex items-center justify-between sticky top-0 z-30 bg-background">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-muted-foreground hover:text-foreground"><Menu size={20} /></button>
          <Link to="/" className="font-mono text-base md:text-lg tracking-[0.3em] font-semibold text-foreground">ZYRA</Link>
        </div>
        <div className="flex items-center gap-4">
          {adminName && <span className="font-sans text-xs text-muted-foreground hidden sm:inline">{adminName}</span>}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent hidden sm:inline">Admin</span>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors"><LogOut size={18} strokeWidth={1.5} /></button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-14">
          <nav className="p-6 space-y-2">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => { setTab(key); resetForm(); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-4 font-mono text-sm uppercase tracking-[0.15em] transition-colors ${tab === key ? "text-accent bg-accent/5" : "text-muted-foreground"}`}>
                <Icon size={18} />{label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="px-4 md:px-12 py-6 md:py-8">
        <div className="hidden md:flex gap-4 mb-8 border-b border-foreground/[0.08] overflow-x-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => { setTab(key); resetForm(); }}
              className={`pb-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors border-b-2 whitespace-nowrap ${tab === key ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon size={14} className="inline mr-2" />{label}
            </button>
          ))}
        </div>

        <div className="md:hidden mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">{tabs.find(t => t.key === tab)?.label}</p>
        </div>

        {tab === "analytics" && <AdminAnalytics />}
        {tab === "orders" && <AdminOrdersDB inputClass={inputClass} adminUserId={adminUserId} adminName={adminName} onAuditLog={logAudit} />}
        {tab === "homepage" && <AdminHeroSlides inputClass={inputClass} />}
        {tab === "contact" && <AdminContact inputClass={inputClass} onAuditLog={logAudit} />}
        {tab === "audit" && <AdminAuditLog />}
        {tab === "account" && <AdminAccount inputClass={inputClass} adminUserId={adminUserId} onAuditLog={logAudit} />}

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
                    <select value={catParentId} onChange={(e) => setCatParentId(e.target.value)} className={inputClass}>
                      <option value="">Sin categoría padre (raíz)</option>
                      {getRootCategories().filter(c => c.id !== editingId).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={saveCategory} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors flex-1 sm:flex-none">Guardar</button>
                      <button onClick={resetForm} className="h-12 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors flex-1 sm:flex-none">Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input placeholder="Nombre" value={prodName} onChange={(e) => setProdName(e.target.value)} className={inputClass} />
                    <input placeholder="Slug (auto)" value={prodSlug} onChange={(e) => setProdSlug(e.target.value)} className={inputClass} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input placeholder="Precio" type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className={inputClass} />
                      <select value={prodCurrency} onChange={(e) => setProdCurrency(e.target.value)} className={inputClass}>
                        <option value="USD">USD ($)</option>
                        <option value="ARS">ARS ($ argentino)</option>
                        <option value="MXN">MXN ($ mexicano)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                      <input placeholder="Referencia" value={prodRef} onChange={(e) => setProdRef(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input placeholder="Unidades" type="number" value={prodUnits} onChange={(e) => setProdUnits(e.target.value)} className={inputClass} />
                      <select value={prodCatId} onChange={(e) => setProdCatId(e.target.value)} className={inputClass}>
                        <option value="">Sin categoría</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{getCategoryLabel(c)}</option>)}
                      </select>
                    </div>

                    {/* Main image — drag & drop + click */}
                    <div className="space-y-2">
                      <label className="block font-sans text-xs text-muted-foreground">Imagen principal</label>
                      <div
                        onDragOver={onDragOver}
                        onDragEnter={(e) => { e.preventDefault(); setDragOverMain(true); }}
                        onDragLeave={() => setDragOverMain(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOverMain(false); handleFileDrop(e.dataTransfer.files, "main"); }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed transition-colors p-4 flex flex-col items-center justify-center gap-2 min-h-[100px] ${dragOverMain ? "border-accent bg-accent/5" : "border-foreground/20 hover:border-foreground/40"}`}
                      >
                        {prodImage ? (
                          <div className="flex items-center gap-3 w-full">
                            <img src={prodImage} alt="Preview" className="w-16 h-16 object-cover bg-secondary flex-shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground truncate flex-1">{prodImage.split("/").pop()}</span>
                            <button onClick={(e) => { e.stopPropagation(); setProdImage(""); }} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <Upload size={20} className="text-muted-foreground" />
                            <span className="font-sans text-xs text-muted-foreground text-center">
                              {uploading ? "Subiendo..." : "Arrastrá una imagen o hacé clic para subir"}
                            </span>
                          </>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                    </div>

                    {/* Gallery — drag & drop + click */}
                    <div className="space-y-2">
                      <label className="block font-sans text-xs text-muted-foreground">Galería</label>
                      <div
                        onDragOver={onDragOver}
                        onDragEnter={(e) => { e.preventDefault(); setDragOverGallery(true); }}
                        onDragLeave={() => setDragOverGallery(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOverGallery(false); handleFileDrop(e.dataTransfer.files, "gallery"); }}
                        onClick={() => galleryInputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed transition-colors p-4 flex flex-col items-center justify-center gap-2 min-h-[100px] ${dragOverGallery ? "border-accent bg-accent/5" : "border-foreground/20 hover:border-foreground/40"}`}
                      >
                        <Image size={20} className="text-muted-foreground" />
                        <span className="font-sans text-xs text-muted-foreground text-center">
                          {uploading ? "Subiendo..." : "Arrastrá imágenes o hacé clic para agregar"}
                        </span>
                      </div>
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                      {prodGallery.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                          {prodGallery.map((url, i) => (
                            <div key={i} className="relative group aspect-square bg-secondary overflow-hidden">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-background/80 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
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
                {/* Category tree view */}
                <div className="space-y-1">
                  {getRootCategories().length === 0 && <p className="font-sans text-sm text-muted-foreground">Sin categorías</p>}
                  {getRootCategories().map((cat) => {
                    const subs = getSubcategories(cat.id);
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between p-4 border border-foreground/[0.08]">
                          <div className="flex items-center gap-2">
                            <FolderOpen size={14} className="text-accent flex-shrink-0" />
                            <div>
                              <p className="font-sans text-sm text-foreground">{cat.name}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{cat.slug}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => editCategory(cat)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                            <button onClick={() => deleteCategory(cat.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {subs.length > 0 && (
                          <div className="ml-6 border-l border-foreground/[0.08]">
                            {subs.map((sub) => (
                              <div key={sub.id} className="flex items-center justify-between p-3 pl-4 border-b border-foreground/[0.08] last:border-b-0">
                                <div className="flex items-center gap-2">
                                  <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="font-sans text-sm text-foreground">{sub.name}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground">{sub.slug}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => editCategory(sub)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                                  <button onClick={() => deleteCategory(sub.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="md:hidden space-y-2">
                  {products.length === 0 ? <p className="font-sans text-sm text-muted-foreground">Sin productos</p> : products.map((prod) => (
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
                <div className="hidden md:block border border-foreground/[0.08]">
                  <div className="grid grid-cols-[auto_1fr_80px_80px_auto] gap-4 px-4 py-3 border-b border-foreground/[0.08] bg-secondary/30">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground w-12"></span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Producto</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Precio</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Uds.</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Acciones</span>
                  </div>
                  {products.length === 0 ? <p className="px-4 py-6 font-sans text-sm text-muted-foreground">Sin productos</p> : products.map((prod) => (
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
