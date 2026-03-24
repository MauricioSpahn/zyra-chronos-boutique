import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import AnnouncementBar from "./AnnouncementBar";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [navPages, setNavPages] = useState<{ slug: string; title: string }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "brand").maybeSingle(),
      supabase.from("custom_pages").select("slug,title").eq("published", true).eq("show_in_nav", true).order("sort_order"),
    ]).then(([brandRes, pagesRes]) => {
      if (brandRes.data?.value) {
        const val = brandRes.data.value as any;
        if (val.logo_url) setLogoUrl(val.logo_url);
      }
      if (pagesRes.data) setNavPages(pagesRes.data);
    });
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
        <header className="border-b border-foreground/[0.08] bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 md:px-12 h-16">
            <Link to="/" className="flex items-center gap-2">
              {logoUrl && (
                <img src={logoUrl} alt="ZYRA" className="h-8 w-auto object-contain" />
              )}
              <span className="font-mono text-lg tracking-[0.3em] font-semibold text-foreground">
                ZYRA
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-10">
              <Link to="/coleccion" className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-150">
                Productos
              </Link>
              <Link to="/contacto" className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-150">
                Contacto
              </Link>
              {navPages.map(p => (
                <Link key={p.slug} to={`/pagina/${p.slug}`} className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-150">
                  {p.title}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-foreground hover:text-accent transition-colors duration-150"
                aria-label="Abrir carrito"
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-accent text-accent-foreground font-mono text-[9px] tabular-nums">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-foreground hover:text-accent transition-colors"
                aria-label="Menú"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-foreground/[0.08] bg-background px-6 py-4 space-y-3">
              <Link to="/coleccion" onClick={() => setMobileMenuOpen(false)} className="block font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
                Productos
              </Link>
              <Link to="/contacto" onClick={() => setMobileMenuOpen(false)} className="block font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </Link>
              {navPages.map(p => (
                <Link key={p.slug} to={`/pagina/${p.slug}`} onClick={() => setMobileMenuOpen(false)} className="block font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </header>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
