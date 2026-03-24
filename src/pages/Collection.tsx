import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, Loader2, SlidersHorizontal, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

// Recursive category tree filter component
const CategoryTreeFilter = ({
  categories,
  parentId,
  depth,
  activeCategory,
  expandedIds,
  onSelect,
  onToggleExpand,
}: {
  categories: DBCategory[];
  parentId: string | null;
  depth: number;
  activeCategory: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
}) => {
  const children = categories.filter(c => c.parent_id === parentId);
  if (children.length === 0) return null;

  return (
    <div className={depth > 0 ? "border-l border-foreground/[0.06]" : ""}>
      {children.map(cat => {
        const hasChildren = categories.some(c => c.parent_id === cat.id);
        const isActive = activeCategory === cat.id;
        const isExpanded = expandedIds.has(cat.id);
        const isAncestorOfActive = activeCategory ? isAncestor(categories, cat.id, activeCategory) : false;

        return (
          <div key={cat.id}>
            <div className="flex items-center">
              <button
                onClick={() => onSelect(cat.id)}
                className={`flex-1 text-left py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors ${
                  isActive ? "text-accent" : isAncestorOfActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ paddingLeft: `${1 + depth * 1}rem` }}
              >
                {cat.name}
              </button>
              {hasChildren && (
                <button
                  onClick={() => onToggleExpand(cat.id)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <CategoryTreeFilter
                categories={categories}
                parentId={cat.id}
                depth={depth + 1}
                activeCategory={activeCategory}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Check if `ancestorId` is an ancestor of `childId`
function isAncestor(categories: DBCategory[], ancestorId: string, childId: string): boolean {
  let current = categories.find(c => c.id === childId);
  while (current?.parent_id) {
    if (current.parent_id === ancestorId) return true;
    current = categories.find(c => c.id === current!.parent_id);
  }
  return false;
}

// Get all descendant IDs recursively
function getDescendantIds(categories: DBCategory[], parentId: string): string[] {
  const children = categories.filter(c => c.parent_id === parentId);
  return children.reduce<string[]>((acc, c) => [...acc, c.id, ...getDescendantIds(categories, c.id)], []);
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  const rootCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);

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
      const allIds = [activeCategory, ...getDescendantIds(categories, activeCategory)];
      result = result.filter(p => p.category_id && allIds.includes(p.category_id));
    }
    return result;
  }, [search, activeCategory, products, categories]);

  const handleSelectCategory = useCallback((id: string | null) => {
    setActiveCategory(id);
    // Auto-expand ancestors of selected category
    if (id) {
      const newExpanded = new Set(expandedIds);
      let current = categories.find(c => c.id === id);
      while (current?.parent_id) {
        newExpanded.add(current.parent_id);
        current = categories.find(c => c.id === current!.parent_id);
      }
      // Also expand the selected category itself if it has children
      if (categories.some(c => c.parent_id === id)) {
        newExpanded.add(id);
      }
      setExpandedIds(newExpanded);
    }
    setFilterOpen(false);
  }, [expandedIds, categories]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const FilterContent = () => (
    <div className="space-y-0">
      <button
        onClick={() => handleSelectCategory(null)}
        className={`w-full text-left px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] border-b border-foreground/[0.04] transition-colors ${
          !activeCategory ? "text-accent bg-accent/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        Todos los productos
      </button>
      <CategoryTreeFilter
        categories={categories}
        parentId={null}
        depth={0}
        activeCategory={activeCategory}
        expandedIds={expandedIds}
        onSelect={handleSelectCategory}
        onToggleExpand={toggleExpand}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
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

            {/* Filter button (mobile + desktop) */}
            {categories.length > 0 && (
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <button className={`h-10 px-4 bg-secondary border border-foreground/[0.08] flex items-center gap-2 transition-colors shrink-0 ${
                    activeCategory ? "text-accent border-accent/30" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    <SlidersHorizontal size={14} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
                      {isMobile ? "Filtrar" : "Categorías"}
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-background border-foreground/[0.08] p-0">
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

          {/* Active filter chip */}
          {activeCategory && (
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
        </section>

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
