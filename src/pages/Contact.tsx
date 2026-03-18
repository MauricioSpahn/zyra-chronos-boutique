import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";

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
      if (data) setContact(data.value as ContactData);
    };
    fetch();
  }, []);

  const socials = contact ? [
    { label: "Instagram", url: contact.instagram },
    { label: "Facebook", url: contact.facebook },
    { label: "TikTok", url: contact.tiktok },
  ].filter(s => s.url) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <section className="px-6 md:px-12 py-20 md:py-32 max-w-3xl mx-auto">
          <h1 className="font-mono text-2xl md:text-4xl tracking-[0.2em] text-foreground mb-4">CONTACTO</h1>
          <p className="font-sans text-sm text-muted-foreground mb-16 max-w-md">
            Estamos aquí para ayudarte. Contáctanos por cualquiera de estos medios y te responderemos a la brevedad.
          </p>

          {!contact ? (
            <p className="font-sans text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-10">
              {contact.email && (
                <div className="flex items-start gap-4">
                  <Mail size={20} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Correo electrónico</p>
                    <a href={`mailto:${contact.email}`} className="font-sans text-sm text-foreground hover:text-accent transition-colors">
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {contact.whatsapp && (
                <div className="flex items-start gap-4">
                  <MessageCircle size={20} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">WhatsApp</p>
                    <a
                      href={`https://wa.me/${contact.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-sm text-foreground hover:text-accent transition-colors"
                    >
                      +{contact.whatsapp}
                    </a>
                  </div>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-start gap-4">
                  <Phone size={20} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Teléfono</p>
                    <a href={`tel:${contact.phone}`} className="font-sans text-sm text-foreground hover:text-accent transition-colors">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {contact.address && (
                <div className="flex items-start gap-4">
                  <MapPin size={20} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Dirección</p>
                    <p className="font-sans text-sm text-foreground">{contact.address}</p>
                  </div>
                </div>
              )}

              {socials.length > 0 && (
                <div className="pt-8 border-t border-foreground/[0.08]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Redes sociales</p>
                  <div className="flex flex-wrap gap-4">
                    {socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.url!.startsWith("http") ? s.url! : `https://${s.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-12 px-6 border border-foreground/[0.08] font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:border-accent transition-colors flex items-center"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
};

export default Contact;
