import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface FeaturedSection {
  title: string;
  subtitle: string;
  product_ids: string[];
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
}

interface Props {
  inputClass: string;
}

const AdminFeaturedSections = ({ inputClass }: Props) => {
  const [sections, setSections] = useState<FeaturedSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "featured_sections").maybeSingle(),
      supabase.from("products").select("id,name,image_url").order("name"),
    ]).then(([settingsRes, prodsRes]) => {
      if (settingsRes.data?.value) {
        const val = settingsRes.data.value as any;
        if (Array.isArray(val.sections)) setSections(val.sections);
      }
      if (prodsRes.data) setProducts(prodsRes.data as Product[]);
    });
  }, []);

  const addSection = () => {
    setSections([...sections, { title: "Nueva sección", subtitle: "", product_ids: [] }]);
  };

  const removeSection = (i: number) => {
    setSections(sections.filter((_, idx) => idx !== i));
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    const ni = i + dir;
    if (ni < 0 || ni >= sections.length) return;
    const arr = [...sections];
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setSections(arr);
  };

  const updateSection = (i: number, field: keyof FeaturedSection, value: any) => {
    const arr = [...sections];
    (arr[i] as any)[field] = value;
    setSections(arr);
  };

  const toggleProduct = (sectionIndex: number, productId: string) => {
    const arr = [...sections];
    const ids = arr[sectionIndex].product_ids;
    if (ids.includes(productId)) {
      arr[sectionIndex].product_ids = ids.filter(id => id !== productId);
    } else {
      arr[sectionIndex].product_ids = [...ids, productId];
    }
    setSections(arr);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({
      key: "featured_sections",
      value: { sections } as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) toast.error("Error al guardar");
    else toast.success("Secciones guardadas");
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Secciones destacadas del inicio
        </p>
        <button onClick={addSection} className="flex items-center gap-1 text-accent hover:text-foreground transition-colors font-mono text-[10px] uppercase tracking-wider">
          <Plus size={14} /> Agregar
        </button>
      </div>

      {sections.length === 0 && (
        <p className="font-sans text-sm text-muted-foreground">
          No hay secciones. Agregá una para mostrar productos destacados en el inicio.
        </p>
      )}

      {sections.map((section, i) => (
        <div key={i} className="border border-foreground/[0.08] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-accent uppercase">Sección {i + 1}</span>
            <div className="flex gap-1">
              <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp size={14} /></button>
              <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown size={14} /></button>
              <button onClick={() => removeSection(i)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-sans text-xs text-muted-foreground mb-1">Título (ej: "Últimas novedades")</label>
              <input value={section.title} onChange={(e) => updateSection(i, "title", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block font-sans text-xs text-muted-foreground mb-1">Subtítulo (opcional)</label>
              <input value={section.subtitle} onChange={(e) => updateSection(i, "subtitle", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-2">
              Productos ({section.product_ids.length} seleccionados, máx 3 recomendados)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {products.map(p => {
                const selected = section.product_ids.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(i, p.id)}
                    className={`flex items-center gap-2 p-2 border text-left transition-colors ${
                      selected
                        ? "border-accent bg-accent/5 text-foreground"
                        : "border-foreground/[0.08] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 object-cover bg-secondary flex-shrink-0" />}
                    <span className="font-sans text-[11px] truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      <button onClick={save} disabled={saving} className="w-full sm:w-auto h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar secciones"}
      </button>
    </div>
  );
};

export default AdminFeaturedSections;
