import { useState, useEffect, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import ProductCard from "@/components/ProductCard";
import { usePageTracking } from "@/hooks/usePageTracking";

interface DBProduct {
  id: string; name: string; slug: string; price: number;
  image_url: string | null; reference: string | null;
  description: string | null; specs: Record<string, string>;
  gallery: string[]; units_available: number;
  category_id: string | null; currency: string;
}

interface DBCategory {
  id: string; name: string; slug: string; parent_id: string | null;
}

const Collection = () => {
  usePageTracking();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionContent, setCollectionContent] = useState<{ title?: string; description?: string; media_url?: string; media_type?: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: cats }, { data: settings }] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("site_settings").select("value").eq("key", "collection_page").maybeSingle(),
      ]);
      setProducts((prods as DBProduct[]) || []);
      setCategories((cats as DBCategory[]) || []);
      if (settings) setCollectionContent(settings.value as any);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Separate parent categories and subcategories
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

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
      // Include products from subcategories too
      const subcatIds = categories.filter(c => c.parent_id === activeCategory).map(c => c.id);
      const allIds = [activeCategory, ...subcatIds];
      result = result.filter(p => p.category_id && allIds.includes(p.category_id));
    }
    return result;
  }, [search, activeCategory, products, categories]);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header />
      <main className="pt-24">
        {/* Hero section */}
        <section className="px-6 md:px-12 py-20 md:py-32 border-b border-foreground/[0.08]">
          <h1 className="font-mono text-3xl md:text-5xl tracking-[0.2em] text-foreground mb-4">
            {collectionContent?.title || "COLECCIÓN"}
          </h1>
          {collectionContent?.description && (
            <p className="font-sans text-sm md:text-base text-muted-foreground max-w-xl whitespace-pre-line">
              {collectionContent.description}
            </p>
          )}
          {collectionContent?.media_url && (
            <div className="mt-8 max-w-2xl">
              {collectionContent.media_type === "video" ? (
                <video src={collectionContent.media_url} controls className="w-full" />
              ) : (
                <img src={collectionContent.media_url} alt="" className="w-full object-cover" />
              )}
            </div>
          )}
        </section>

        {/* Search + filters */}
        <section className="px-6 md:px-12 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pieza..."
                className="w-full h-10 pl-9 pr-8 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
              {filtered.length} pieza{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Categories */}
          {parentCategories.length > 0 && (
            <div className="space-y-3 mb-8">
              <div className="flex gap-2 flex-wrap">
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
                  return (
                    <div key={cat.id} className="relative group">
                      <button
                        onClick={() => setActiveCategory(cat.id)}
                        className={`h-8 px-4 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors duration-150 ${
                          activeCategory === cat.id ? "border-accent text-accent bg-accent/5" : "border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/20"
                        }`}
                      >
                        {cat.name}
                      </button>
                      {subs.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 bg-secondary border border-foreground/[0.08] py-1 min-w-[150px] hidden group-hover:block z-10">
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
            </div>
          )}
        </section>

        {/* Products grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 md:px-12 pb-16 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              {search ? `No se encontraron piezas para "${search}".` : "Aún no hay productos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-foreground/[0.08]">
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
