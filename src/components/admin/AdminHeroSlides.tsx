import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, GripVertical, Film, Image, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface HeroSlide {
  id: string;
  media_url: string;
  media_type: string;
  sort_order: number;
}

interface Props {
  inputClass: string;
}

const AdminHeroSlides = ({ inputClass }: Props) => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [uploading, setUploading] = useState(false);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroButton, setHeroButton] = useState("");
  const [heroButtonLink, setHeroButtonLink] = useState("#collection");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandFooter, setBrandFooter] = useState("");
  const [announcementText, setAnnouncementText] = useState("ENVÍOS SIN CARGO A TODO EL PAÍS");
  const [collectionTitle, setCollectionTitle] = useState("COLECCIÓN");
  const [collectionDesc, setCollectionDesc] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSlides();
    fetchSettings();
  }, []);

  const fetchSlides = async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
    if (data) setSlides(data as HeroSlide[]);
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
          setHeroButtonLink(val.buttonLink || "#collection");
        }
        if (row.key === "brand") {
          setBrandTagline(val.tagline || "");
          setBrandFooter(val.footer_text || "");
          setLogoUrl(val.logo_url || "");
        }
        if (row.key === "announcement_bar") {
          setAnnouncementText(val.text || "");
        }
        if (row.key === "collection_page") {
          setCollectionTitle(val.title || "COLECCIÓN");
          setCollectionDesc(val.description || "");
        }
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isVideo = ["mp4", "webm", "mov", "ogg"].includes(ext || "");
      const mediaType = isVideo ? "video" : "image";
      const path = `slides/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { error } = await supabase.storage.from("hero").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast.error(`Error: ${error.message}`); continue; }

      const { data: { publicUrl } } = supabase.storage.from("hero").getPublicUrl(path);
      const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.sort_order)) + 1 : 0;

      const { error: insertErr } = await supabase.from("hero_slides").insert({
        media_url: publicUrl,
        media_type: mediaType,
        sort_order: maxOrder,
      });
      if (insertErr) toast.error(insertErr.message);
    }

    await fetchSlides();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    toast.success("Media subida correctamente");
  };

  const deleteSlide = async (id: string) => {
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Slide eliminado"); fetchSlides(); }
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const updated = [...slides];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    for (let i = 0; i < updated.length; i++) {
      await supabase.from("hero_slides").update({ sort_order: i }).eq("id", updated[i].id);
    }
    fetchSlides();
  };

  const saveSettings = async () => {
    setSaving(true);
    const [{ error: e1 }, { error: e2 }, { error: e3 }, { error: e4 }] = await Promise.all([
      supabase.from("site_settings").update({
        value: { title: heroTitle, subtitle: heroSubtitle, buttonText: heroButton, buttonLink: heroButtonLink } as any,
        updated_at: new Date().toISOString(),
      }).eq("key", "hero"),
      supabase.from("site_settings").update({
        value: { tagline: brandTagline, footer_text: brandFooter, logo_url: logoUrl } as any,
        updated_at: new Date().toISOString(),
      }).eq("key", "brand"),
      supabase.from("site_settings").upsert({
        key: "announcement_bar",
        value: { text: announcementText } as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({
        key: "collection_page",
        value: { title: collectionTitle, description: collectionDesc } as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" }),
    ]);
    if (e1 || e2 || e3 || e4) toast.error("Error al guardar");
    else toast.success("Configuración guardada");
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Slides manager */}
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Slides del Hero (imágenes y videos)</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-14 border border-dashed border-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors flex items-center justify-center gap-2 font-sans text-xs"
        >
          <Upload size={16} />
          {uploading ? "Subiendo..." : "Subir imágenes o videos (selección múltiple)"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/mov"
          multiple
          onChange={handleUpload}
          className="hidden"
        />

        {slides.length > 0 && (
          <div className="space-y-2">
            {slides.map((slide, i) => (
              <div key={slide.id} className="flex items-center gap-3 p-3 border border-foreground/[0.08] bg-secondary/20">
                <div className="flex flex-col gap-1 text-muted-foreground">
                  <button onClick={() => moveSlide(i, -1)} disabled={i === 0} className="hover:text-foreground disabled:opacity-20 p-1"><GripVertical size={12} /></button>
                </div>
                <div className="w-16 h-12 bg-secondary overflow-hidden flex-shrink-0 relative">
                  {slide.media_type === "video" ? (
                    <>
                      <video src={slide.media_url} className="w-full h-full object-cover" muted />
                      <Film size={12} className="absolute bottom-1 right-1 text-foreground/60" />
                    </>
                  ) : (
                    <>
                      <img src={slide.media_url} alt="" className="w-full h-full object-cover" />
                      <Image size={12} className="absolute bottom-1 right-1 text-foreground/60" />
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-muted-foreground truncate">{slide.media_url.split("/").pop()}</p>
                  <p className="font-mono text-[10px] text-accent uppercase">{slide.media_type}</p>
                </div>
                <button onClick={() => deleteSlide(slide.id)} className="p-2 text-muted-foreground hover:text-destructive flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcement Bar */}
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Barra de anuncios</p>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Texto (dejá vacío para ocultar)</label>
          <input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} className={inputClass} placeholder="ENVÍOS SIN CARGO A TODO EL PAÍS" />
        </div>
      </div>

      {/* Text settings */}
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Textos del Hero</p>
        <div className="space-y-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Título principal</label>
            <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Subtítulo</label>
            <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} className={`${inputClass} h-auto py-3`} />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Texto del botón</label>
            <input value={heroButton} onChange={(e) => setHeroButton(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Enlace del botón</label>
            <input value={heroButtonLink} onChange={(e) => setHeroButtonLink(e.target.value)} placeholder="#collection, /productos, https://..." className={inputClass} />
            <p className="font-mono text-[10px] text-muted-foreground mt-1">Ejemplos: #collection, /producto/zyra-one, https://link-externo.com</p>
          </div>
        </div>
      </div>

      {/* Collection page */}
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Página de colección</p>
        <div className="space-y-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Título</label>
            <input value={collectionTitle} onChange={(e) => setCollectionTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Descripción</label>
            <textarea value={collectionDesc} onChange={(e) => setCollectionDesc(e.target.value)} rows={4} className={`${inputClass} h-auto py-3`} placeholder="Texto introductorio de la colección..." />
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Marca</p>
        <div className="space-y-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Tagline</label>
            <input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Texto footer</label>
            <input value={brandFooter} onChange={(e) => setBrandFooter(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
};

export default AdminHeroSlides;
