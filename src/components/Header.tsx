import { ShoppingBag, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import AnnouncementBar from "./AnnouncementBar";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface MobileCategory {
  id: string; name: string; slug: string; parent_id: string | null;
}

const MobileCategoryTree = ({
  categories,
  parentId,
  depth,
  expandedIds,
  onToggle,
  onClose,
}: {
  categories: MobileCategory[];
  parentId: string | null;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
}) => {
  const children = categories.filter(c => c.parent_id === parentId);
  if (!children.length) return null;
  return (
    <>
      {children.map(cat => {
        const hasKids = categories.some(c => c.parent_id === cat.id);
        const isOpen = expandedIds.has(cat.id);
        return (
          <div key={cat.id}>
            <div className="flex items-center" style={{ paddingLeft: `${depth * 1}rem` }}>
              <Link
                to={`/coleccion?cat=${cat.id}`}
                onClick={onClose}
                className="flex-1 py-2 font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              >
                {cat.name}
              </Link>
              {hasKids && (
                <button onClick={() => onToggle(cat.id)} className="p-2 text-muted-foreground hover:text-foreground">
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}
            </div>
            {hasKids && isOpen && (
              <MobileCategoryTree categories={categories} parentId={cat.id} depth={depth + 1} expandedIds={expandedIds} onToggle={onToggle} onClose={onClose} />
            )}
          </div>
        );
      })}
    </>
  );
};

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(false);
  const [expandedCatIds, setExpandedCatIds] = useState<Set<string>>(new Set());
  const { totalItems } = useCart();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [navPages, setNavPages] = useState<{ slug: string; title: string }[]>([]);
  const [categories, setCategories] = useState<MobileCategory[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "brand").maybeSingle(),
      supabase.from("custom_pages").select("slug,title").eq("published", true).eq("show_in_nav", true).order("sort_order"),
      supabase.from("categories").select("id,name,slug,parent_id").order("name"),
    ]).then(([brandRes, pagesRes, catsRes]) => {
      if (brandRes.data?.value) {
        const val = brandRes.data.value as any;
        if (val.logo_url) setLogoUrl(val.logo_url);
      }
      if (pagesRes.data) setNavPages(pagesRes.data);
      if (catsRes.data) setCategories(catsRes.data as MobileCategory[]);
    });
  }, []);

  const toggleCatExpand = (id: string) => {
    setExpandedCatIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeMobile = () => {
    setMobileMenuOpen(false);
    setProductsExpanded(false);
    setExpandedCatIds(new Set());
  };

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
                onClick={() => {
                  if (mobileMenuOpen) closeMobile();
                  else setMobileMenuOpen(true);
                }}
                className="md:hidden p-2 text-foreground hover:text-accent transition-colors"
                aria-label="Menú"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-foreground/[0.08] bg-background px-6 py-4 space-y-1">
              {/* Productos: first tap expands categories, second tap navigates */}
              <div>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      if (productsExpanded) {
                        // Second tap → navigate
                        closeMobile();
                        window.location.href = "/coleccion";
                      } else {
                        setProductsExpanded(true);
                      }
                    }}
                    className="flex-1 text-left py-2 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Productos
                  </button>
                  {categories.length > 0 && (
                    <button
                      onClick={() => setProductsExpanded(!productsExpanded)}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      {productsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {productsExpanded && categories.length > 0 && (
                  <div className="pl-2 border-l border-foreground/[0.06] ml-1 mb-2">
                    <Link
                      to="/coleccion"
                      onClick={closeMobile}
                      className="block py-2 font-sans text-[11px] uppercase tracking-[0.15em] text-accent hover:text-foreground transition-colors"
                    >
                      Ver todos
                    </Link>
                    <MobileCategoryTree
                      categories={categories}
                      parentId={null}
                      depth={0}
                      expandedIds={expandedCatIds}
                      onToggle={toggleCatExpand}
                      onClose={closeMobile}
                    />
                  </div>
                )}
              </div>

              <Link to="/contacto" onClick={closeMobile} className="block py-2 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </Link>
              {navPages.map(p => (
                <Link key={p.slug} to={`/pagina/${p.slug}`} onClick={closeMobile} className="block py-2 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
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
