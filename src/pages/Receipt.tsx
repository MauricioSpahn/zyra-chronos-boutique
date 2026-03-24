import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";

interface OrderData {
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  payment_reference: string | null;
}

interface OrderItem {
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

const Receipt = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) { setNotFound(true); setLoading(false); return; }

      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (!orderData) { setNotFound(true); setLoading(false); return; }

      setOrder(orderData as unknown as OrderData);

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("product_name, price, quantity, subtotal")
        .eq("order_id", orderData.id);

      setItems((itemsData || []) as unknown as OrderItem[]);
      setLoading(false);
    };
    fetchOrder();
  }, [orderNumber]);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#1a1a1a",
      });
      const link = document.createElement("a");
      link.download = `ZYRA-Comprobante-${orderNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download error:", err);
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-mono text-sm text-muted-foreground">Comprobante no encontrado.</p>
          <Link to="/" className="inline-block mt-6 h-12 px-8 leading-[3rem] bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px]">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="h-16 border-b border-foreground/[0.08] flex items-center px-6 md:px-12 gap-4">
        <Link to="/" className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} strokeWidth={1.5} />
          Tienda
        </Link>
        <span className="ml-auto font-mono text-xs uppercase tracking-[0.3em] text-foreground">Comprobante</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Download button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 h-12 px-6 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Descargar PDF
          </button>
        </div>

        {/* Receipt card */}
        <div ref={receiptRef} className="bg-card border border-foreground/[0.08] p-6 md:p-10">
          {/* Header */}
          <div className="text-center pb-8 border-b border-foreground/[0.08]">
            <h1 className="font-mono text-2xl tracking-[0.3em] font-semibold text-foreground">ZYRA</h1>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Comprobante de compra</p>
          </div>

          {/* Order info */}
          <div className="grid grid-cols-2 gap-4 py-6 border-b border-foreground/[0.08]">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Orden Nº</p>
              <p className="font-mono text-sm text-foreground mt-1">#{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Fecha</p>
              <p className="font-mono text-sm text-foreground mt-1">{dateStr}</p>
            </div>
          </div>

          {/* Customer */}
          <div className="py-6 border-b border-foreground/[0.08]">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Cliente</p>
            <p className="font-sans text-sm text-foreground">{order.first_name} {order.last_name}</p>
            <p className="font-sans text-xs text-muted-foreground mt-1">{order.email}</p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              {order.address_line1}, {order.city}, {order.state} {order.postal_code}
            </p>
          </div>

          {/* Items */}
          <div className="py-6 border-b border-foreground/[0.08]">
            <div className="flex justify-between mb-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Producto</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Precio</p>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between py-3 border-t border-foreground/[0.04]">
                <div>
                  <p className="font-sans text-sm text-foreground">{item.product_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">Cant: {item.quantity}</p>
                </div>
                <p className="font-mono text-sm tabular-nums text-foreground">${item.subtotal.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-6">
            <div className="flex justify-between mb-2">
              <span className="font-sans text-sm text-muted-foreground">Subtotal</span>
              <span className="font-mono text-sm tabular-nums text-foreground">${Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-sans text-sm text-muted-foreground">Envío</span>
              <span className="font-mono text-sm tabular-nums text-foreground">
                {Number(order.shipping_cost) === 0 ? "Gratis" : `$${Number(order.shipping_cost).toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between pt-4 border-t border-foreground/[0.08]">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">Total</span>
              <span className="font-mono text-xl tabular-nums text-foreground">${Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment ref */}
          {order.payment_reference && (
            <div className="pt-4 border-t border-foreground/[0.08]">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Referencia de pago</p>
              <p className="font-mono text-xs text-foreground mt-1">{order.payment_reference}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-foreground/[0.08] text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              © 2026 ZYRA — Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
