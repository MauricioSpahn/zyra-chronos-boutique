import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppBubble = () => {
  const [whatsapp, setWhatsapp] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle();
      if (data) {
        const val = data.value as Record<string, string>;
        setWhatsapp(val.whatsapp || "");
      }
    };
    fetch();
  }, []);

  if (!whatsapp) return null;

  const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, tengo una consulta sobre ZYRA")}`;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 bg-secondary border border-foreground/[0.08] p-4 w-72 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
          <p className="font-sans text-sm text-foreground mb-1">¿Tenés alguna consulta?</p>
          <p className="font-sans text-xs text-muted-foreground mb-4">Escribinos por WhatsApp y te respondemos a la brevedad.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-10 bg-[#25D366] text-white font-sans text-xs uppercase tracking-[0.15em] font-medium flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition-colors"
          >
            <MessageCircle size={16} /> Enviar mensaje
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:bg-[#20BD5A] transition-colors hover:scale-105 active:scale-95"
        aria-label="WhatsApp"
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
};

export default WhatsAppBubble;
