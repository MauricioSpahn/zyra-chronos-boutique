import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, MessageCircle, Globe } from "lucide-react";

interface Props {
  inputClass: string;
  onAuditLog: (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => Promise<void>;
}

const AdminContact = ({ inputClass, onAuditLog }: Props) => {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("key", "contact").maybeSingle();
    if (data) {
      const val = data.value as Record<string, string>;
      setEmail(val.email || "");
      setWhatsapp(val.whatsapp || "");
      setPhone(val.phone || "");
      setInstagram(val.instagram || "");
      setFacebook(val.facebook || "");
      setTiktok(val.tiktok || "");
      setAddress(val.address || "");
    }
  };

  const save = async () => {
    setSaving(true);
    const value = { email, whatsapp, phone, instagram, facebook, tiktok, address };

    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "contact").maybeSingle();
    if (existing) {
      await supabase.from("site_settings").update({ value: value as any, updated_at: new Date().toISOString() }).eq("key", "contact");
    } else {
      await supabase.from("site_settings").insert({ key: "contact", value: value as any });
    }

    await onAuditLog("update_contact", "site_settings", "contact", value);
    toast.success("Datos de contacto guardados");
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Estos datos se mostrarán en la página de contacto y la burbuja de WhatsApp
      </p>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Correo electrónico</p>
        </div>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="contacto@zyra.com" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">WhatsApp (con código de país, ej: 5215512345678)</p>
        </div>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} placeholder="5215512345678" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Teléfono</p>
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+52 55 1234 5678" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Redes sociales</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Instagram (URL o @usuario)</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClass} placeholder="https://instagram.com/zyra" />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Facebook</label>
            <input value={facebook} onChange={(e) => setFacebook(e.target.value)} className={inputClass} placeholder="https://facebook.com/zyra" />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">TikTok</label>
            <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} className={inputClass} placeholder="https://tiktok.com/@zyra" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block font-sans text-xs text-muted-foreground">Dirección física (opcional)</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClass} h-auto py-3`} rows={2} placeholder="Ciudad de México, México" />
      </div>

      <button onClick={save} disabled={saving} className="w-full sm:w-auto h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar contacto"}
      </button>
    </div>
  );
};

export default AdminContact;
