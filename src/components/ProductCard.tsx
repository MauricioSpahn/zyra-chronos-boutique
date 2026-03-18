import { motion } from "framer-motion";
import { useState } from "react";

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  specs: { diameter: string; movement: string };
  index: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number], delay: i * 0.1 },
  }),
};

const ProductCard = ({ name, price, image, specs, index }: ProductCardProps) => {
  const [hovered, setHovered] = useState(false);

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
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <motion.img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.05 : 1 }}
          transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        />

        {/* Specs overlay on hover */}
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
          <button className="mt-4 h-10 px-6 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150">
            Adquirir pieza
          </button>
        </motion.div>
      </div>

      <div className="p-4 md:p-6 flex items-center justify-between">
        <span className="font-sans text-sm text-foreground">{name}</span>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          ${price.toLocaleString()}
        </span>
      </div>
    </motion.article>
  );
};

export default ProductCard;
