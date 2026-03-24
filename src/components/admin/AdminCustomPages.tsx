import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Pencil, Eye, EyeOff, Globe } from "lucide-react";
import { toast } from "sonner";

interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  show_in_nav: boolean;
  sort_order: number;
}

interface Props {
  inputClass: string;
}

const AdminCustomPages = ({ inputClass }: Props) => {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [showInNav, setShowInNav] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    const { data } = await supabase.from("custom_pages").select("*").order("sort_order");
    if (data) setPages(data as CustomPage[]);
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setEditing(null); setShowForm(false);
    setTitle(""); setSlug(""); setContent(""); setPublished(false); setShowInNav(true);
  };

  const editPage = (p: CustomPage) => {
    setEditing(p); setTitle(p.title); setSlug(p.slug);
    setContent(p.content); setPublished(p.published);
    setShowInNav(p.show_in_nav); setShowForm(true);
  };

  const savePage = async () => {
    const finalSlug = slug || slugify(title);
    if (!title.trim()) { toast.error("Ingresá un título"); return; }
    setSaving(true);
    const payload = {
      title, slug: finalSlug, content, published, show_in_nav: showInNav,
      sort_order: editing ? editing.sort_order : pages.length,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("custom_pages").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Página actualizada");
    } else {
      const { error } = await supabase.from("custom_pages").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Página creada");
    }
    resetForm(); fetchPages(); setSaving(false);
  };

  const deletePage = async (id: string) => {
    const { error } = await supabase.from("custom_pages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Página eliminada"); fetchPages(); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Páginas personalizadas</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 text-accent hover:text-foreground transition-colors font-mono text-[10px] uppercase tracking-wider">
          <Plus size={14} /> Nueva página
        </button>
      </div>

      {showForm && (
        <div className="border border-foreground/[0.08] p-4 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            {editing ? "Editar página" : "Nueva página"}
          </p>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Sobre nosotros" />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Slug (URL)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="sobre-nosotros (auto)" />
            <p className="font-mono text-[10px] text-muted-foreground mt-1">URL: /pagina/{slug || slugify(title || "...")}</p>
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Contenido (HTML permitido)</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className={`${inputClass} h-auto py-3 font-mono text-xs`} placeholder="<h2>Título</h2><p>Contenido...</p>" />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-accent" />
              <span className="font-sans text-sm text-foreground">Publicada</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showInNav} onChange={(e) => setShowInNav(e.target.checked)} className="w-4 h-4 accent-accent" />
              <span className="font-sans text-sm text-foreground">Mostrar en navegación</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={savePage} disabled={saving} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={resetForm} className="h-12 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pages.length === 0 && !showForm && (
        <p className="font-sans text-sm text-muted-foreground">No hay páginas personalizadas.</p>
      )}

      {pages.map(p => (
        <div key={p.id} className="flex items-center gap-3 p-4 border border-foreground/[0.08]">
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm text-foreground">{p.title}</p>
            <p className="font-mono text-[10px] text-muted-foreground">/pagina/{p.slug}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {p.published ? <Eye size={14} className="text-accent" /> : <EyeOff size={14} className="text-muted-foreground" />}
            {p.show_in_nav && <Globe size={14} className="text-accent" />}
            <button onClick={() => editPage(p)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
            <button onClick={() => deletePage(p.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminCustomPages;
