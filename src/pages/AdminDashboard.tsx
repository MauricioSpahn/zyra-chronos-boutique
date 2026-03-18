import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Package, FolderOpen, Plus, Trash2, Pencil } from "lucide-react";
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"products" | "categories">("products");
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

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

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
    resetForm();
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Categoría eliminada");
    fetchData();
  };

  const editCategory = (cat: Category) => {
    setEditingId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setShowForm(true);
  };

  // PRODUCT CRUD
  const saveProduct = async () => {
    const slug = prodSlug || slugify(prodName);
    let specs: Record<string, string> = {};
    let gallery: string[] = [];
    try { specs = prodSpecs ? JSON.parse(prodSpecs) : {}; } catch { toast.error("Specs JSON inválido"); return; }
    try { gallery = prodGallery ? JSON.parse(prodGallery) : []; } catch { toast.error("Gallery JSON inválido"); return; }

    const payload = {
      name: prodName,
      slug,
      price: Number(prodPrice),
      reference: prodRef,
      units_available: Number(prodUnits) || 0,
      category_id: prodCatId || null,
      description: prodDesc,
      image_url: prodImage,
      specs,
      gallery,
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
    resetForm();
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Producto eliminado");
    fetchData();
  };

  const editProduct = (p: Product) => {
    setEditingId(p.id);
    setProdName(p.name);
    setProdSlug(p.slug);
    setProdPrice(String(p.price));
    setProdRef(p.reference);
    setProdUnits(String(p.units_available));
    setProdCatId(p.category_id || "");
    setProdDesc(p.description);
    setProdImage(p.image_url);
    setProdGallery(JSON.stringify(p.gallery));
    setProdSpecs(JSON.stringify(p.specs, null, 2));
    setShowForm(true);
  };

  const inputClass = "w-full h-10 px-3 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <div className="flex gap-6 mb-8 border-b border-foreground/[0.08]">
          <button
            onClick={() => { setTab("products"); resetForm(); }}
            className={`pb-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors border-b-2 ${tab === "products" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Package size={14} className="inline mr-2" />Productos
          </button>
          <button
            onClick={() => { setTab("categories"); resetForm(); }}
            className={`pb-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors border-b-2 ${tab === "categories" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <FolderOpen size={14} className="inline mr-2" />Categorías
          </button>
        </div>

        {/* Action button */}
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="mb-6 h-10 px-6 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150 inline-flex items-center gap-2"
        >
          <Plus size={14} /> {tab === "products" ? "Nuevo producto" : "Nueva categoría"}
        </button>

        {/* Form */}
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
                  <button onClick={saveCategory} className="h-10 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors">
                    Guardar
                  </button>
                  <button onClick={resetForm} className="h-10 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors">
                    Cancelar
                  </button>
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
                  <button onClick={saveProduct} className="h-10 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors">
                    Guardar
                  </button>
                  <button onClick={resetForm} className="h-10 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Table */}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
