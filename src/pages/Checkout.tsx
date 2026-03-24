import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Wallet, Loader2, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import { ARGENTINA_PROVINCES, DEFAULT_SHIPPING_RATES, ShippingRate, calculateShipping } from "@/data/argentinaData";

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
  firstName: "", lastName: "", email: "", phone: "",
  addressLine1: "", addressLine2: "", city: "", state: "",
  postalCode: "", country: "AR",
};

const generateOrderNumber = () => {
  const now = Date.now();
  return String(now).slice(-10);
};

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<ShippingForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>(DEFAULT_SHIPPING_RATES);
  const [freeShippingMin, setFreeShippingMin] = useState(0);

  // Load shipping rates from DB
  useEffect(() => {
    const loadRates = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "shipping_rates")
        .maybeSingle();
      if (data?.value) {
        const val = data.value as any;
        if (val.rates) setShippingRates(val.rates);
        if (val.freeShippingMin !== undefined) setFreeShippingMin(val.freeShippingMin);
      }
    };
    loadRates();
  }, []);

  // Calculate shipping cost
  const shippingCost = useMemo(() => {
    if (freeShippingMin > 0 && totalPrice >= freeShippingMin) return 0;
    if (!form.postalCode.trim()) return null;
    return calculateShipping(form.postalCode, shippingRates);
  }, [form.postalCode, shippingRates, totalPrice, freeShippingMin]);

  const total = totalPrice + (shippingCost ?? 0);

  const updateField = (field: keyof ShippingForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isFormValid =
    form.firstName.trim() && form.lastName.trim() && form.email.trim() &&
    form.addressLine1.trim() && form.city.trim() && form.state.trim() &&
    form.postalCode.trim() && shippingCost !== null && items.length > 0;

  // Handle MP return
  const returnStatus = searchParams.get("status");
  const returnOrder = searchParams.get("order");
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const sessionId = searchParams.get("session_id");

  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{ approved: boolean; status: string; order_number: string } | null>(null);

  useEffect(() => {
    if (paymentId && sessionId && !confirmResult && !confirming) {
      setConfirming(true);
      supabase.functions.invoke("confirm-mp-payment", {
        body: { payment_id: paymentId, session_id: sessionId },
      }).then(({ data, error }) => {
        if (error) {
          console.error("Confirm error:", error);
          setConfirmResult({ approved: false, status: "error", order_number: returnOrder || "" });
        } else {
          setConfirmResult(data);
        }
        setConfirming(false);
      });
    }
  }, [paymentId, sessionId]);

  // Return status screen
  if (returnStatus || confirmResult || confirming) {
    const status = confirmResult?.approved ? "approved" : confirmResult?.status || returnStatus || "pending";
    const orderNum = confirmResult?.order_number || returnOrder || "";

    if (confirming) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="text-center">
            <Loader2 className="mx-auto mb-6 animate-spin text-accent" size={48} />
            <p className="font-mono text-sm text-muted-foreground">Verificando tu pago...</p>
          </div>
        </div>
      );
    }

    const Icon = status === "approved" ? CheckCircle : status === "pending" ? Clock : XCircle;
    const iconColor = status === "approved" ? "text-accent" : "text-muted-foreground";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="text-center max-w-md"
        >
          <Icon className={`mx-auto mb-6 ${iconColor}`} size={48} strokeWidth={1} />
          <h1 className="font-mono text-2xl tracking-tight text-foreground">
            {status === "approved" ? "Pago aprobado" : status === "pending" ? "Pago pendiente" : "Pago no procesado"}
          </h1>
          {orderNum && (
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Orden #{orderNum}
            </p>
          )}
          <p className="mt-6 font-sans text-sm text-muted-foreground leading-relaxed">
            {status === "approved"
              ? "Tu pago fue procesado exitosamente. Tu pedido ha sido creado y recibirás un correo con los detalles."
              : status === "pending"
              ? "Tu pago está pendiente de confirmación. Te notificaremos cuando se acredite."
              : "Hubo un problema con tu pago. Puedes intentar de nuevo."}
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

  // Empty cart
  if (items.length === 0) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const orderNum = generateOrderNumber();
      const finalShipping = shippingCost ?? 0;

      const { data: session, error: sessionError } = await supabase
        .from("checkout_sessions")
        .insert({
          order_number: orderNum,
          customer_data: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            addressLine1: form.addressLine1.trim(),
            addressLine2: form.addressLine2.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            postalCode: form.postalCode.trim(),
            country: form.country,
          },
          items: items.map(item => ({
            name: item.name,
            image: item.image,
            price: item.price,
            currency: item.currency || "ARS",
            quantity: item.quantity,
          })),
          subtotal: totalPrice,
          shipping_cost: finalShipping,
          total: totalPrice + finalShipping,
        })
        .select()
        .single();

      if (sessionError || !session) {
        console.error("Session error:", sessionError);
        throw new Error(sessionError?.message || "Error creando sesión");
      }

      const currentOrigin = window.location.origin;
      const { data: mpData, error: mpError } = await supabase.functions.invoke(
        "create-mp-preference",
        {
          body: {
            session_id: session.id,
            order_number: orderNum,
            items: items.map((item) => ({
              title: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              currency_id: item.currency || "ARS",
            })),
            shipping_cost: finalShipping,
            payer: {
              email: form.email.trim(),
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
            },
            back_urls: {
              success: `${currentOrigin}/checkout?status=approved&order=${orderNum}&session_id=${session.id}`,
              failure: `${currentOrigin}/checkout?status=failure&order=${orderNum}&session_id=${session.id}`,
              pending: `${currentOrigin}/checkout?status=pending&order=${orderNum}&session_id=${session.id}`,
            },
          },
        }
      );

      if (mpError) throw mpError;
      if (!mpData?.init_point && !mpData?.sandbox_init_point) {
        throw new Error("Mercado Pago no devolvió una URL de pago");
      }

      const redirectUrl = mpData.init_point || mpData.sandbox_init_point;
      clearCart();
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error("Error al procesar tu pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full h-11 md:h-12 px-3 bg-secondary border border-foreground/[0.08] font-sans text-sm text-foreground focus:outline-none focus:border-accent transition-colors rounded-none appearance-none";

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 md:h-16 border-b border-foreground/[0.08] flex items-center px-4 md:px-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span className="hidden sm:inline">Seguir comprando</span>
          <span className="sm:hidden">Volver</span>
        </Link>
        <span className="ml-auto font-mono text-xs uppercase tracking-[0.3em] text-foreground">
          Checkout
        </span>
      </header>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-0 lg:min-h-[calc(100vh-4rem)]">
        {/* Left: Shipping + Payment */}
        <div className="lg:col-span-3 lg:border-r border-foreground/[0.08] p-4 md:p-12 space-y-8 md:space-y-10">
          {/* Contact */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 md:mb-6">Información de contacto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nombre *</Label>
                <Input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Apellido *</Label>
                <Input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Teléfono</Label>
                <Input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm" />
              </div>
            </div>
          </motion.section>

          <Separator className="bg-foreground/[0.08]" />

          {/* Shipping Address */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.1 }}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 md:mb-6">Dirección de envío</h2>
            <div className="space-y-3 md:space-y-4">
              {/* Country */}
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">País *</Label>
                <select
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className={selectClass}
                >
                  <option value="AR">Argentina</option>
                </select>
              </div>

              {/* Province */}
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Provincia *</Label>
                <select
                  value={form.state}
                  onChange={(e) => {
                    updateField("state", e.target.value);
                    updateField("city", "");
                  }}
                  className={selectClass}
                  required
                >
                  <option value="">Seleccioná tu provincia</option>
                  {ARGENTINA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dirección *</Label>
                <Input value={form.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} placeholder="Calle y número" className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Piso / Depto (opcional)</Label>
                <Input value={form.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm" />
              </div>

              {/* City + CP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Localidad *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Tu localidad"
                    className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Código postal *</Label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Ej: 1425"
                    maxLength={4}
                    className="bg-secondary border-foreground/[0.08] text-foreground placeholder:text-muted-foreground/50 rounded-none h-11 md:h-12 text-sm"
                    required
                  />
                  {form.postalCode.length >= 4 && shippingCost === null && (
                    <p className="font-mono text-[10px] text-destructive mt-1">
                      Código postal fuera de zona de cobertura
                    </p>
                  )}
                  {form.postalCode.length >= 4 && shippingCost !== null && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Truck size={12} className="text-accent" />
                      <p className="font-mono text-[10px] text-accent">
                        {shippingCost === 0 ? "¡Envío gratis!" : `Envío: $${shippingCost.toLocaleString()}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          <Separator className="bg-foreground/[0.08]" />

          {/* Payment info */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.2 }}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 md:mb-6">Pago seguro</h2>
            <div className="p-4 md:p-5 border border-foreground/[0.08] bg-secondary/20 space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard size={20} strokeWidth={1.5} className="text-accent flex-shrink-0" />
                <Wallet size={20} strokeWidth={1.5} className="text-accent flex-shrink-0" />
                <p className="font-sans text-sm text-foreground">Procesado por Mercado Pago</p>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                Acepta tarjetas de crédito y débito (Visa, Mastercard, AMEX), saldo de Mercado Pago, transferencias bancarias y cuotas sin interés.
              </p>
              <p className="font-mono text-[10px] text-accent">
                Serás redirigido a Mercado Pago para completar el pago de forma segura.
              </p>
            </div>
          </motion.section>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-2 p-4 md:p-12 bg-secondary/30 border-t lg:border-t-0 border-foreground/[0.08]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.15 }}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 md:mb-6">Resumen del pedido</h2>

            <div className="space-y-0">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 md:gap-4 py-3 md:py-4 border-b border-foreground/[0.08]">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-secondary overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-foreground truncate">{item.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Cant: {item.quantity}</p>
                  </div>
                  <p className="font-mono text-sm tabular-nums text-foreground flex-shrink-0">
                    ${(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
              <div className="flex justify-between">
                <span className="font-sans text-sm text-muted-foreground">Subtotal</span>
                <span className="font-mono text-sm tabular-nums text-foreground">${totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-sm text-muted-foreground">Envío</span>
                <span className="font-mono text-sm tabular-nums text-foreground">
                  {shippingCost === null
                    ? "Ingresá tu CP"
                    : shippingCost === 0
                    ? "Gratis"
                    : `$${shippingCost.toLocaleString()}`}
                </span>
              </div>
              {shippingCost === 0 && freeShippingMin > 0 && (
                <p className="font-mono text-[10px] text-accent">Envío gratis en pedidos +${freeShippingMin.toLocaleString()}</p>
              )}
            </div>

            <Separator className="bg-foreground/[0.08] my-4 md:my-6" />

            <div className="flex justify-between items-baseline">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">Total</span>
              <span className="font-mono text-xl md:text-2xl tabular-nums text-foreground">${total.toLocaleString()}</span>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="mt-6 md:mt-8 w-full h-12 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                "Pagar con Mercado Pago"
              )}
            </button>

            <p className="mt-3 md:mt-4 font-sans text-[10px] text-muted-foreground/60 text-center leading-relaxed">
              Al confirmar, aceptás nuestros términos y condiciones. Tu información se maneja de forma segura.
            </p>
          </motion.div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
