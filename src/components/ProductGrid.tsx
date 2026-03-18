import ProductCard from "./ProductCard";
import watch1 from "@/assets/watch-1.jpg";
import watch2 from "@/assets/watch-2.jpg";
import watch3 from "@/assets/watch-3.jpg";
import watch4 from "@/assets/watch-4.jpg";

const products = [
  {
    name: "Obsidian Classic",
    price: 2450,
    image: watch1,
    specs: { diameter: "Ø 40mm", movement: "Automático" },
  },
  {
    name: "Cobalt Diver",
    price: 3200,
    image: watch2,
    specs: { diameter: "Ø 42mm", movement: "Automático 200m" },
  },
  {
    name: "Rose Heritage",
    price: 4100,
    image: watch3,
    specs: { diameter: "Ø 38mm", movement: "Cuerda manual" },
  },
  {
    name: "Void Stealth",
    price: 2800,
    image: watch4,
    specs: { diameter: "Ø 41mm", movement: "Automático" },
  },
];

const ProductGrid = () => {
  return (
    <section id="collection" className="border-t border-foreground/[0.08]">
      <div className="px-6 md:px-12 py-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-8">
          Colección
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 border-l border-foreground/[0.08]">
        {products.map((product, i) => (
          <ProductCard key={product.name} {...product} index={i} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
