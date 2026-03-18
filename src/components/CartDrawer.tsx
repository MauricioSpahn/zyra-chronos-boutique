import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-foreground/[0.08]"
          >
            <div className="flex items-center justify-between p-6 border-b border-foreground/[0.08]">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                Carrito
              </span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] px-6">
              <p className="font-sans text-sm text-muted-foreground text-center leading-relaxed">
                Tu carrito está vacío.
              </p>
              <button
                onClick={onClose}
                className="mt-6 h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              >
                Continuar explorando
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
