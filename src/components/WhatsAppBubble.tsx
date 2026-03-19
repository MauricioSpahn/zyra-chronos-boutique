import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppIcon = ({ size = 28 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 175.216 175.552" fill="currentColor">
    <defs>
      <linearGradient id="wa-b" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#57d163" />
        <stop offset="1" stopColor="#23b33a" />
      </linearGradient>
    </defs>
    <path d="M87.184 14.2A73.68 73.68 0 0 0 17.87 100.17l-10.5 38.34 39.3-10.3a73.6 73.6 0 0 0 35.2 8.97h.03c40.64 0 73.72-33.07 73.74-73.72a73.24 73.24 0 0 0-21.6-52.12A73.24 73.24 0 0 0 87.184 14.2" fill="#e0e0e0" />
    <path d="M87.184 14.2A73.68 73.68 0 0 0 17.87 100.17l-10.5 38.34 39.3-10.3a73.6 73.6 0 0 0 35.2 8.97h.03c40.64 0 73.72-33.07 73.74-73.72a73.24 73.24 0 0 0-21.6-52.12A73.24 73.24 0 0 0 87.184 14.2" fill="url(#wa-b)" />
    <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043a6.76 6.76 0 0 0-4.894 2.3c-1.682 1.837-6.42 6.271-6.42 15.298s6.573 17.746 7.49 18.97c.92 1.226 12.692 20.2 31.294 27.5 15.46 6.064 18.604 4.858 21.955 4.554 3.352-.304 10.81-4.42 12.338-8.684 1.527-4.264 1.527-7.922 1.07-8.684-.46-.764-1.682-1.225-3.524-2.14s-10.812-5.336-12.494-5.946c-1.68-.61-2.907-.916-4.13.916-1.225 1.837-4.744 5.948-5.816 7.17-1.073 1.225-2.144.916-3.986.305-1.837-.61-7.76-2.86-14.784-9.124-5.465-4.873-9.154-10.891-10.228-12.73-1.073-1.836-.115-2.83.808-3.746.828-.824 1.837-2.143 2.756-3.215.918-1.073 1.224-1.837 1.837-3.063.612-1.225.306-2.296-.153-3.215-.46-.916-4.048-10.018-5.7-13.635" />
  </svg>
);

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
        <div className="fixed bottom-32 right-6 z-50 bg-secondary border border-foreground/[0.08] p-4 w-72 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
          <p className="font-sans text-sm text-foreground mb-1">¿Tenés alguna consulta?</p>
          <p className="font-sans text-xs text-muted-foreground mb-4">Escribinos por WhatsApp y te respondemos a la brevedad.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 bg-[#25D366] text-white font-sans text-xs uppercase tracking-[0.15em] font-medium flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition-colors"
          >
            <WhatsAppIcon size={18} /> Enviar mensaje
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 group"
        aria-label="WhatsApp"
      >
        <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#20BD5A] transition-all hover:scale-105 active:scale-95 text-white">
          <WhatsAppIcon size={36} />
        </div>
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-[#25D366] group-hover:text-[#20BD5A] transition-colors">
          ¡Consultanos!
        </span>
      </button>
    </>
  );
};

export default WhatsAppBubble;
