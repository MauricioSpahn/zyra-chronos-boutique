import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Tag } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  specs: { diameter: string; movement: string };
  index: number;
  currency?: string;
  badgeFreeShipping?: boolean;
  badgeDiscountPercent?: number | null;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number], delay: i * 0.1 },
  }),
};

const ProductCard = ({ id, name, price, image, specs, index, currency = "USD", badgeFreeShipping, badgeDiscountPercent }: ProductCardProps) => {
  const [hovered, setHovered] = useState(false);
  const sym = currency === 'ARS' ? 'ARS $' : currency === 'EUR' ? '€' : currency === 'MXN' ? 'MX $' : '$';

  const discountedPrice = badgeDiscountPercent && badgeDiscountPercent > 0
    ? Math.round(price * (1 - badgeDiscountPercent / 100))
    : null;

  return (
    <motion.article
      custom={index}
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="group relative border-r border-b border-foreground/[0.08] cursor-pointer overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/producto/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <motion.img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {badgeFreeShipping && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground font-mono text-[9px] uppercase tracking-[0.15em]">
                <Truck size={10} /> Envío gratis
              </span>
            )}
            {badgeDiscountPercent && badgeDiscountPercent > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-foreground text-background font-mono text-[9px] uppercase tracking-[0.15em]">
                <Tag size={10} /> -{badgeDiscountPercent}%
              </span>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {specs.diameter}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {specs.movement}
            </span>
            <span className="mt-4 h-10 px-6 inline-flex items-center bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150">
              Ver detalle
            </span>
          </motion.div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm text-foreground">{name}</span>
            <div className="text-right">
              {discountedPrice !== null ? (
                <>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground line-through mr-2">
                    {sym}{price.toLocaleString()}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-accent">
                    {sym}{discountedPrice.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {sym}{price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default ProductCard;
