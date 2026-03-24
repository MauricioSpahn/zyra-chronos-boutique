import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface FeaturedSection {
  title: string;
  subtitle: string;
  product_ids: string[];
  layout: "grid" | "carousel";
}

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  currency: string;
  badge_free_shipping: boolean;
  badge_discount_percent: number | null;
}

const FeaturedSections = () => {
  const [sections, setSections] = useState<FeaturedSection[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "featured_sections").maybeSingle(),
      supabase.from("products").select("id,name,slug,price,image_url,currency,badge_free_shipping,badge_discount_percent"),
    ]).then(([settingsRes, prodsRes]) => {
      if (settingsRes.data?.value) {
        const val = settingsRes.data.value as any;
        if (Array.isArray(val.sections)) setSections(val.sections);
      }
      if (prodsRes.data) setProducts(prodsRes.data as DBProduct[]);
      setLoaded(true);
    });
  }, []);

  if (!loaded || sections.length === 0) return null;

  return (
    <>
      {sections.map((section, si) => {
        const sectionProducts = section.product_ids
          .map(id => products.find(p => p.id === id))
          .filter(Boolean) as DBProduct[];

        if (sectionProducts.length === 0) return null;

        return (
          <section key={si} className="border-t border-foreground/[0.08] px-6 md:px-12 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            >
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="mt-2 font-sans text-sm text-muted-foreground/70 max-w-md">
                  {section.subtitle}
                </p>
              )}
            </motion.div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/[0.08]">
              {sectionProducts.slice(0, 3).map((product, i) => {
                const discountedPrice = product.badge_discount_percent
                  ? product.price * (1 - product.badge_discount_percent / 100)
                  : null;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                  >
                    <Link
                      to={`/producto/${product.slug || product.id}`}
                      className="block bg-background group"
                    >
                      <div className="aspect-square overflow-hidden bg-secondary relative">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          {product.badge_free_shipping && (
                            <span className="bg-accent text-accent-foreground font-mono text-[9px] uppercase tracking-wider px-2 py-1">
                              Envío gratis
                            </span>
                          )}
                          {product.badge_discount_percent && (
                            <span className="bg-destructive text-destructive-foreground font-mono text-[9px] uppercase tracking-wider px-2 py-1">
                              -{product.badge_discount_percent}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors">
                          {product.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {discountedPrice ? (
                            <>
                              <span className="font-mono text-sm tabular-nums text-foreground">
                                ${discountedPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                              </span>
                              <span className="font-mono text-xs tabular-nums text-muted-foreground line-through">
                                ${product.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-sm tabular-nums text-foreground">
                              ${product.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
};

export default FeaturedSections;
