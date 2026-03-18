import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import CartDrawer from "./CartDrawer";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-foreground/[0.08] bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 md:px-12 h-16">
          <Link to="/" className="font-mono text-lg tracking-[0.3em] font-semibold text-foreground">
            ZYRA
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            <Link to="/" className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-150">
              Colección
            </Link>
            <Link to="/" className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-150">
              Sobre Zyra
            </Link>
          </nav>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-foreground hover:text-accent transition-colors duration-150"
            aria-label="Abrir carrito"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
