import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Mail, Phone, MessageCircle, MapPin, Instagram, Facebook } from "lucide-react";

interface ContactData {
  email: string;
  whatsapp: string;
  phone: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  address: string;
}

const Contact = () => {
  usePageTracking();
  const [contact, setContact] = useState<ContactData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "contact").maybeSingle();
      if (data) setContact(data.value as unknown as ContactData);
    };
    fetch();
  }, []);

  const socials = contact ? [
    { label: "Instagram", url: contact.instagram, icon: Instagram },
    { label: "Facebook", url: contact.facebook, icon: Facebook },
    { label: "TikTok", url: contact.tiktok },
  ].filter(s => s.url) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="px-6 md:px-12 py-20 md:py-32 border-b border-foreground/[0.08]">
          <h1 className="font-mono text-3xl md:text-5xl tracking-[0.2em] text-foreground mb-4">CONTACTO</h1>
          <p className="font-sans text-sm md:text-base text-muted-foreground max-w-lg">
            Estamos aquí para ayudarte. Elegí el canal que más te convenga y te respondemos a la brevedad.
          </p>
        </section>

        {!contact ? (
          <div className="px-6 md:px-12 py-16">
            <p className="font-sans text-sm text-muted-foreground">Cargando información de contacto...</p>
          </div>
        ) : (
          <section className="px-6 md:px-12 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-foreground/[0.08]">
              {/* Email */}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="group p-8 border-b md:border-r border-foreground/[0.08] hover:bg-secondary/30 transition-colors">
                  <Mail size={24} className="text-accent mb-4" strokeWidth={1.5} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Correo electrónico</p>
                  <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors break-all">
                    {contact.email}
                  </p>
                </a>
              )}

              {/* WhatsApp */}
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="group p-8 border-b lg:border-r border-foreground/[0.08] hover:bg-secondary/30 transition-colors">
                  <MessageCircle size={24} className="text-accent mb-4" strokeWidth={1.5} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">WhatsApp</p>
                  <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors">
                    +{contact.whatsapp}
                  </p>
                </a>
              )}

              {/* Phone */}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="group p-8 border-b border-foreground/[0.08] hover:bg-secondary/30 transition-colors">
                  <Phone size={24} className="text-accent mb-4" strokeWidth={1.5} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Teléfono</p>
                  <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors">
                    {contact.phone}
                  </p>
                </a>
              )}

              {/* Address */}
              {contact.address && (
                <div className="p-8 border-b md:border-r border-foreground/[0.08]">
                  <MapPin size={24} className="text-accent mb-4" strokeWidth={1.5} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Dirección</p>
                  <p className="font-sans text-sm text-foreground">{contact.address}</p>
                </div>
              )}

              {/* Socials */}
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url!.startsWith("http") ? s.url! : `https://${s.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-8 border-b border-foreground/[0.08] hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-6 h-6 mb-4 text-accent">
                    {s.icon ? <s.icon size={24} strokeWidth={1.5} /> : <span className="font-mono text-sm">{s.label[0]}</span>}
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{s.label}</p>
                  <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors truncate">
                    {s.url}
                  </p>
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">¿Tenés una consulta especial?</p>
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Hola, tengo una consulta sobre ZYRA")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-12 px-8 bg-[#25D366] text-white font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-[#20BD5A] transition-colors"
                >
                  <MessageCircle size={16} />
                  Escribinos por WhatsApp
                </a>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
};

export default Contact;
