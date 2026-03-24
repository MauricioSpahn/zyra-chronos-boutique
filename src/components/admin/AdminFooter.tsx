import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  inputClass: string;
}

const AdminFooter = ({ inputClass }: Props) => {
  const [description, setDescription] = useState("");
  const [copyright, setCopyright] = useState("© 2026 ZYRA. Todos los derechos reservados.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "footer").maybeSingle().then(({ data }) => {
      if (data?.value) {
        const val = data.value as any;
        if (val.description) setDescription(val.description);
        if (val.copyright) setCopyright(val.copyright);
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({
      key: "footer",
      value: { description, copyright } as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) toast.error("Error al guardar");
    else toast.success("Footer guardado");
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Footer</p>
      <div>
        <label className="block font-sans text-xs text-muted-foreground mb-1">Descripción de marca</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} h-auto py-3`} placeholder="Precisión mecánica destilada en cada pieza..." />
      </div>
      <div>
        <label className="block font-sans text-xs text-muted-foreground mb-1">Texto de copyright</label>
        <input value={copyright} onChange={(e) => setCopyright(e.target.value)} className={inputClass} />
      </div>
      <button onClick={save} disabled={saving} className="w-full sm:w-auto h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar footer"}
      </button>
    </div>
  );
};

export default AdminFooter;
