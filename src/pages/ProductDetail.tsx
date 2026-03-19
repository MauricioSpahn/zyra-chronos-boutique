import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

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
  currency: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      // Try by slug first, then by id
      let { data } = await supabase
        .from("products")
        .select("*")
        .eq("slug", id || "")
        .maybeSingle();

      if (!data) {
        const res = await supabase
          .from("products")
          .select("*")
          .eq("id", id || "")
          .maybeSingle();
        data = res.data;
      }

      setProduct(data as DBProduct | null);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-muted-foreground">Producto no encontrado</p>
          <Link to="/" className="inline-block mt-6 font-sans text-xs uppercase tracking-[0.2em] text-accent hover:text-foreground transition-colors">
            ← Volver a la colección
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages = Array.isArray(product.gallery) ? product.gallery.filter(Boolean) : [];
  const mainImage = product.image_url || "/placeholder.svg";
  const gallery = [mainImage, ...galleryImages.filter(img => img !== mainImage)];
  
  const currencySymbol = product.currency === 'ARS' ? 'ARS $' : product.currency === 'EUR' ? '€' : product.currency === 'MXN' ? 'MX $' : '$';

  const specs = product.specs || {};
  const specEntries = Object.entries(specs).map(([key, value]) => ({
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    value: value as string,
  }));

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % gallery.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + gallery.length) % gallery.length);

  const handleAddToCart = () => {
    addItem(
      { id: product.id, name: product.name, price: product.price, image: product.image_url || "/placeholder.svg" },
      quantity
    );
    toast.success(`${product.name} añadido al carrito`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="px-6 md:px-12 py-6 border-b border-foreground/[0.08]">
          <Link to="/" className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-150">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Colección
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Gallery */}
          <div className="relative border-b lg:border-b-0 lg:border-r border-foreground/[0.08]">
            <div className="relative aspect-square overflow-hidden bg-secondary">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={gallery[selectedImage]}
                  alt={`${product.name} - Vista ${selectedImage + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {gallery.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors" aria-label="Imagen anterior">
                    <ChevronLeft size={18} strokeWidth={1.5} />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors" aria-label="Siguiente imagen">
                    <ChevronRight size={18} strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="flex border-t border-foreground/[0.08]">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-1 aspect-[3/2] overflow-hidden border-r last:border-r-0 border-foreground/[0.08] transition-opacity duration-150 ${selectedImage === i ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number], delay: 0.1 }}
              className="p-6 md:p-12 flex-1"
            >
              {product.reference && (
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Ref. {product.reference}
                </span>
              )}
              <h1 className="mt-3 font-mono text-3xl md:text-4xl tracking-tighter text-foreground">{product.name}</h1>
              <p className="mt-4 font-mono text-2xl tabular-nums text-foreground">${product.price.toLocaleString()}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                Unidades numeradas: {product.units_available}
              </p>
              {product.description && (
                <p className="mt-8 font-sans text-sm text-muted-foreground leading-relaxed max-w-lg">{product.description}</p>
              )}

              <div className="mt-10 flex items-center gap-4">
                <div className="flex items-center border border-foreground/[0.08]">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-12 flex items-center justify-center font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">−</button>
                  <span className="w-10 h-12 flex items-center justify-center font-mono text-sm tabular-nums text-foreground border-x border-foreground/[0.08]">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-12 flex items-center justify-center font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">+</button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
                >
                  Adquirir pieza
                </button>
              </div>
            </motion.div>

            {specEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="border-t border-foreground/[0.08]"
              >
                <div className="p-6 md:px-12 md:py-8">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-6">Especificaciones técnicas</h2>
                  <div className="space-y-0">
                    {specEntries.map((spec) => (
                      <div key={spec.label} className="flex items-start justify-between py-3 border-b border-foreground/[0.08] last:border-b-0">
                        <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">{spec.label}</span>
                        <span className="font-sans text-sm text-foreground text-right max-w-[55%]">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
