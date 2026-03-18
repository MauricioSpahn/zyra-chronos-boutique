import ProductCard from "./ProductCard";
import { products } from "@/data/products";

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
    </section>
  );
};

export default ProductGrid;
