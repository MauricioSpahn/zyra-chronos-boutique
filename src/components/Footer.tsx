import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-foreground/[0.08] px-6 md:px-12 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <span className="font-mono text-lg tracking-[0.3em] font-semibold text-foreground">
            ZYRA
          </span>
          <p className="mt-4 font-sans text-sm text-muted-foreground leading-relaxed max-w-xs">
            Precisión mecánica destilada en cada pieza.
            Para quienes valoran la manufactura sobre el logo.
          </p>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Navegación
          </span>
          <ul className="mt-4 space-y-3">
            <li><Link to="/" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">Colección</Link></li>
            <li><Link to="/contacto" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Newsletter
          </span>
          <div className="mt-4 flex">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 bg-transparent border-b border-foreground/[0.08] py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
            <button className="ml-4 h-12 px-6 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150">
              Enviar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-foreground/[0.08] flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
          © 2026 ZYRA. Todos los derechos reservados.
        </span>
        <div className="flex items-center gap-6">
          {["Privacidad", "Términos"].map((item) => (
            <a key={item} href="#" className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-150">
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
