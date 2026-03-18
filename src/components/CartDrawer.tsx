import { X, Minus, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const navigate = useNavigate();

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
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-foreground/[0.08] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-foreground/[0.08]">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                Carrito ({items.length})
              </span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 px-6">
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
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-6 border-b border-foreground/[0.08]">
                      <div className="w-20 h-20 bg-secondary overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-foreground truncate">{item.name}</p>
                        <p className="font-mono text-sm tabular-nums text-muted-foreground mt-1">
                          ${item.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-foreground/[0.08]">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="w-8 h-8 flex items-center justify-center font-mono text-xs tabular-nums text-foreground border-x border-foreground/[0.08]">
                              {item.quantity}
                            </span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-foreground/[0.08]">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</span>
                    <span className="font-mono text-lg tabular-nums text-foreground">${totalPrice.toLocaleString()}</span>
                  </div>
                  <button className="w-full h-12 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150">
                    Finalizar compra
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
