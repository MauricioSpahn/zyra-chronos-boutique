import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, Loader2, SlidersHorizontal, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import ProductCard from "@/components/ProductCard";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface DBProduct {
  id: string; name: string; slug: string; price: number;
  image_url: string | null; reference: string | null;
  description: string | null; specs: Record<string, string>;
  gallery: string[]; units_available: number;
  category_id: string | null; currency: string;
  badge_free_shipping: boolean; badge_discount_percent: number | null;
}

interface DBCategory {
  id: string; name: string; slug: string; parent_id: string | null;
}

const Collection = () => {
  usePageTracking();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts((prods as DBProduct[]) || []);
      setCategories((cats as DBCategory[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const activeCategoryName = useMemo(() => {
    if (!activeCategory) return "Todas";
    return categories.find(c => c.id === activeCategory)?.name || "Todas";
  }, [activeCategory, categories]);

  const filtered = useMemo(() => {
    let result = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.reference || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      const subcatIds = categories.filter(c => c.parent_id === activeCategory).map(c => c.id);
      const allIds = [activeCategory, ...subcatIds];
      result = result.filter(p => p.category_id && allIds.includes(p.category_id));
    }
    return result;
  }, [search, activeCategory, products, categories]);

  const handleSelectCategory = useCallback((id: string | null) => {
    setActiveCategory(id);
    setFilterOpen(false);
  }, []);

  const FilterContent = () => (
    <div className="space-y-1">
      <button
        onClick={() => handleSelectCategory(null)}
        className={`w-full text-left px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] border-b border-foreground/[0.04] transition-colors ${
          !activeCategory ? "text-accent bg-accent/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        Todos los productos
      </button>
      {parentCategories.map((cat) => {
        const subs = getSubcategories(cat.id);
        const isActive = activeCategory === cat.id;
        const hasActiveSub = subs.some(s => s.id === activeCategory);
        return (
          <div key={cat.id}>
            <button
              onClick={() => handleSelectCategory(cat.id)}
              className={`w-full text-left px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] border-b border-foreground/[0.04] transition-colors flex items-center justify-between ${
                isActive || hasActiveSub ? "text-accent bg-accent/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <span>{cat.name}</span>
              {subs.length > 0 && <ChevronRight size={12} className={isActive || hasActiveSub ? "text-accent" : ""} />}
            </button>
            {subs.length > 0 && (isActive || hasActiveSub) && (
              <div className="bg-secondary/50">
                {subs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectCategory(sub.id)}
                    className={`w-full text-left pl-8 pr-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] border-b border-foreground/[0.04] transition-colors ${
                      activeCategory === sub.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      <main className="pt-24">
        {/* Top bar: title + search + filter toggle */}
        <section className="px-4 md:px-12 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-mono text-xl md:text-2xl tracking-[0.25em] text-foreground uppercase">
              Productos
            </h1>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
              {filtered.length} pieza{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full h-10 pl-9 pr-8 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile filter button */}
            {isMobile && categories.length > 0 && (
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <button className="h-10 px-4 bg-secondary border border-foreground/[0.08] flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <SlidersHorizontal size={14} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em]">Filtrar</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] bg-background border-foreground/[0.08] p-0">
                  <SheetHeader className="px-4 py-4 border-b border-foreground/[0.08]">
                    <SheetTitle className="font-mono text-xs uppercase tracking-[0.25em] text-foreground">Categorías</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Active filter chip on mobile */}
          {isMobile && activeCategory && (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">Filtro:</span>
              <button
                onClick={() => setActiveCategory(null)}
                className="h-7 px-3 bg-accent/10 border border-accent/30 font-mono text-[10px] uppercase tracking-[0.15em] text-accent flex items-center gap-1.5"
              >
                {activeCategoryName}
                <X size={10} />
              </button>
            </div>
          )}

          {/* Desktop category pills */}
          {!isMobile && categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              <button
                onClick={() => setActiveCategory(null)}
                className={`h-8 px-4 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors duration-150 ${
                  !activeCategory ? "border-accent text-accent bg-accent/5" : "border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                Todas
              </button>
              {parentCategories.map((cat) => {
                const subs = getSubcategories(cat.id);
                const isActive = activeCategory === cat.id;
                const hasActiveSub = subs.some(s => s.id === activeCategory);
                return (
                  <div key={cat.id} className="relative group">
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      className={`h-8 px-4 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors duration-150 ${
                        isActive || hasActiveSub ? "border-accent text-accent bg-accent/5" : "border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/20"
                      }`}
                    >
                      {cat.name}
                    </button>
                    {subs.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 bg-background border border-foreground/[0.08] py-1 min-w-[160px] hidden group-hover:block z-10">
                        {subs.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setActiveCategory(sub.id)}
                            className={`w-full text-left px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
                              activeCategory === sub.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Products grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 md:px-12 pb-16 pt-8 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              {search ? `No se encontraron productos para "${search}".` : "Aún no hay productos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l border-t border-foreground/[0.08]">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                id={product.slug || product.id}
                name={product.name}
                price={product.price}
                image={product.image_url || "/placeholder.svg"}
                specs={{
                  diameter: (product.specs as any)?.diameter || "",
                  movement: (product.specs as any)?.movement || "",
                }}
                index={i}
                currency={product.currency}
                badgeFreeShipping={product.badge_free_shipping}
                badgeDiscountPercent={product.badge_discount_percent}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppBubble />
    </div>
  );
};

export default Collection;
