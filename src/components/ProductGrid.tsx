import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const ProductGrid = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Extract unique categories from specs (using caseMaterial as a proxy for demo)
  const categories = useMemo(() => {
    const types = [
      { key: "all", label: "Todas" },
      { key: "diver", label: "Diver" },
      { key: "classic", label: "Clásico" },
      { key: "heritage", label: "Heritage" },
      { key: "stealth", label: "Stealth" },
    ];
    return types;
  }, []);

  const filtered = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.specs.movement.toLowerCase().includes(q) ||
          p.specs.caseMaterial.toLowerCase().includes(q)
      );
    }

    if (activeCategory && activeCategory !== "all") {
      result = result.filter((p) =>
        p.id.toLowerCase().includes(activeCategory)
      );
    }

    return result;
  }, [search, activeCategory]);

  return (
    <section id="collection" className="border-t border-foreground/[0.08]">
      <div className="px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Colección
          </h2>

          {/* Search */}
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
        <div className="flex gap-2 flex-wrap mb-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key === "all" ? null : cat.key)}
              className={`h-8 px-4 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors duration-150 ${
                (activeCategory === null && cat.key === "all") || activeCategory === cat.key
                  ? "border-accent text-accent bg-accent/5"
                  : "border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 md:px-12 pb-16 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            No se encontraron piezas para "{search}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-foreground/[0.08]">
          {filtered.map((product, i) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              specs={{ diameter: product.specs.diameter, movement: product.specs.movement }}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
