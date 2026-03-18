import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Wallet, Loader2, CheckCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type PaymentMethod = "card" | "mercadopago";

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const INITIAL_FORM: ShippingForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "MX",
};

const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ZYR-${ts}-${rand}`;
};

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<ShippingForm>(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const shippingCost = totalPrice >= 5000 ? 0 : 350;
  const total = totalPrice + shippingCost;

  const updateField = (field: keyof ShippingForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.addressLine1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim() &&
    items.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const orderNum = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNum,
          email: form.email.trim(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim() || null,
          address_line1: form.addressLine1.trim(),
          address_line2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postalCode.trim(),
          country: form.country,
          payment_method: paymentMethod,
          subtotal: totalPrice,
          shipping_cost: shippingCost,
          total,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        product_image: item.image,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      setOrderNumber(orderNum);
      setOrderComplete(true);
      clearCart();
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error("Error al procesar tu pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-sm text-muted-foreground">Tu carrito está vacío.</p>
          <Link
            to="/"
            className="inline-block mt-6 h-12 px-8 leading-[3rem] bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
          >
            Explorar colección
          </Link>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="text-center max-w-md"
        >
          <CheckCircle className="mx-auto mb-6 text-accent" size={48} strokeWidth={1} />
          <h1 className="font-mono text-2xl tracking-tight text-foreground">Pedido confirmado</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {orderNumber}
          </p>
          <p className="mt-6 font-sans text-sm text-muted-foreground leading-relaxed">
            Recibirás un correo de confirmación en <span className="text-foreground">{form.email}</span> con los detalles de tu pedido y seguimiento de envío.
          </p>
          <p className="mt-4 font-sans text-xs text-muted-foreground">
            El pago será procesado cuando conectemos la pasarela de pagos.
          </p>
          <Link
            to="/"
            className="inline-block mt-8 h-12 px-8 leading-[3rem] bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
          >
            Volver a la tienda
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-foreground/[0.08] flex items-center px-6 md:px-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Seguir comprando
        </Link>
        <span className="ml-auto font-mono text-xs uppercase tracking-[0.3em] text-foreground">
          Checkout
        </span>
      </header>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-0 lg:min-h-[calc(100vh-4rem)]">
        {/* Left: Shipping + Payment */}
        <div className="lg:col-span-3 lg:border-r border-foreground/[0.08] p-6 md:p-12 space-y-10">
          {/* Contact */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-6">
              Información de contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Nombre *
                </Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Apellido *
                </Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Email *
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Teléfono
                </Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                />
              </div>
            </div>
          </motion.section>

          <Separator className="bg-foreground/[0.08]" />

          {/* Shipping */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.1 }}
          >
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-6">
              Dirección de envío
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Dirección *
                </Label>
                <Input
                  value={form.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                  placeholder="Calle y número"
                  className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Apartamento, suite, etc.
                </Label>
                <Input
                  value={form.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
                  className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Ciudad *
                  </Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Estado *
                  </Label>
                  <Input
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    C.P. *
                  </Label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-12"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.section>

          <Separator className="bg-foreground/[0.08]" />

          {/* Payment method */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.2 }}
          >
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-6">
              Método de pago
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex items-center gap-4 p-5 border transition-colors duration-150 ${
                  paymentMethod === "card"
                    ? "border-accent bg-accent/5"
                    : "border-foreground/[0.08] hover:border-foreground/20"
                }`}
              >
                <CreditCard size={20} strokeWidth={1.5} className={paymentMethod === "card" ? "text-accent" : "text-muted-foreground"} />
                <div className="text-left">
                  <p className="font-sans text-sm text-foreground">Tarjeta de crédito / débito</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Visa, Mastercard, AMEX</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("mercadopago")}
                className={`flex items-center gap-4 p-5 border transition-colors duration-150 ${
                  paymentMethod === "mercadopago"
                    ? "border-accent bg-accent/5"
                    : "border-foreground/[0.08] hover:border-foreground/20"
                }`}
              >
                <Wallet size={20} strokeWidth={1.5} className={paymentMethod === "mercadopago" ? "text-accent" : "text-muted-foreground"} />
                <div className="text-left">
                  <p className="font-sans text-sm text-foreground">Mercado Pago</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Saldo, transferencia, cuotas</p>
                </div>
              </button>
            </div>
            <p className="mt-4 font-mono text-[10px] text-muted-foreground/60">
              Los datos de pago se solicitarán al integrar la pasarela. Tu pedido quedará registrado como pendiente.
            </p>
          </motion.section>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-2 p-6 md:p-12 bg-secondary/30 border-t lg:border-t-0 border-foreground/[0.08]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.15 }}
          >
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-6">
              Resumen del pedido
            </h2>

            <div className="space-y-0">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-foreground/[0.08]">
                  <div className="w-16 h-16 bg-secondary overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-foreground truncate">{item.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      Cant: {item.quantity}
                    </p>
                  </div>
                  <p className="font-mono text-sm tabular-nums text-foreground">
                    ${(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-sm text-muted-foreground">Subtotal</span>
                <span className="font-mono text-sm tabular-nums text-foreground">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-sm text-muted-foreground">Envío</span>
                <span className="font-mono text-sm tabular-nums text-foreground">
                  {shippingCost === 0 ? "Gratis" : `$${shippingCost.toLocaleString()}`}
                </span>
              </div>
              {shippingCost === 0 && (
                <p className="font-mono text-[10px] text-accent">Envío gratis en pedidos +$5,000</p>
              )}
            </div>

            <Separator className="bg-foreground/[0.08] my-6" />

            <div className="flex justify-between items-baseline">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">Total</span>
              <span className="font-mono text-2xl tabular-nums text-foreground">
                ${total.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="mt-8 w-full h-12 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar pedido"
              )}
            </button>

            <p className="mt-4 font-sans text-[10px] text-muted-foreground/60 text-center leading-relaxed">
              Al confirmar, aceptas nuestros términos y condiciones. Tu información se maneja de forma segura.
            </p>
          </motion.div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
