import { useState, useEffect, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import ProductCard from "./ProductCard";
import { supabase } from "@/integrations/supabase/client";

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  reference: string | null;
  description: string | null;
  specs: Record<string, string>;
  gallery: string[];
  units_available: number;
  category_id: string | null;
  currency: string;
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
}

const ProductGrid = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filtered = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.reference || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          JSON.stringify(p.specs).toLowerCase().includes(q)
      );
    }

    if (activeCategory) {
      result = result.filter((p) => p.category_id === activeCategory);
    }

    return result;
  }, [search, activeCategory, products]);

  return (
    <section id="collection" className="border-t border-foreground/[0.08]">
      <div className="px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Colección
          </h2>

          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pieza..."
              className="w-full h-10 pl-9 pr-8 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`h-8 px-4 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors duration-150 ${
                activeCategory === null
                  ? "border-accent text-accent bg-accent/5"
                  : "border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`h-8 px-4 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors duration-150 ${
                  activeCategory === cat.id
                    ? "border-accent text-accent bg-accent/5"
                    : "border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 md:px-12 pb-16 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            {search ? `No se encontraron piezas para "${search}".` : "Aún no hay productos en la colección."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-foreground/[0.08]">
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
    </section>
  );
};

export default ProductGrid;
