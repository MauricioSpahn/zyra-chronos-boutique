import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Eye, ChevronLeft, Download, Plus, X, FileText, Calendar, CheckCircle2, Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string; order_number: string; status: string; email: string;
  first_name: string; last_name: string; phone: string | null;
  address_line1: string; address_line2: string | null; city: string;
  state: string; postal_code: string; country: string;
  payment_method: string; payment_status: string; payment_reference: string | null;
  subtotal: number; shipping_cost: number; total: number;
  created_at: string; updated_at: string;
  managed_by_name?: string; delivered_at?: string;
}
interface OrderItem {
  id: string; product_name: string; product_reference: string | null;
  product_image: string | null; price: number; quantity: number; subtotal: number;
}

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmado", shipped: "Enviado",
  delivered: "Entregado", cancelled: "Cancelado",
};

interface Props {
  inputClass: string;
  adminUserId: string;
  adminName: string;
  onAuditLog: (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => Promise<void>;
}

const AdminOrdersDB = ({ inputClass, adminUserId, adminName, onAuditLog }: Props) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showManual, setShowManual] = useState(false);

  // Manual order form
  const [mFirstName, setMFirstName] = useState("");
  const [mLastName, setMLastName] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mAddress, setMAddress] = useState("");
  const [mCity, setMCity] = useState("");
  const [mState, setMState] = useState("");
  const [mPostal, setMPostal] = useState("");
  const [mItems, setMItems] = useState<{ name: string; ref: string; price: string; qty: string }[]>([
    { name: "", ref: "", price: "", qty: "1" },
  ]);
  const [mSaving, setMSaving] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Error cargando pedidos");
    else setOrders((data as Order[]) || []);
    setLoading(false);
  };

  const viewDetails = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems((data as OrderItem[]) || []);
  };

  const updateStatus = async (orderId: string, status: string) => {
    const updateData: any = { status, updated_at: new Date().toISOString(), managed_by: adminUserId, managed_by_name: adminName };
    if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }
    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
    if (error) { toast.error(error.message); return; }

    const order = orders.find(o => o.id === orderId);
    const auditAction = status === "delivered" ? "mark_delivered" : "update_order_status";
    await onAuditLog(auditAction, "order", order?.order_number || orderId, { status, admin: adminName });

    toast.success(`Estado: ${STATUS_LABELS[status]}`);
    fetchOrders();
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status, managed_by_name: adminName, delivered_at: status === "delivered" ? new Date().toISOString() : prev.delivered_at } : null);
  };

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`¿Eliminar pedido ${orderNumber}? Esta acción no se puede deshacer.`)) return;
    // Delete items first, then order
    await supabase.from("order_items").delete().eq("order_id", orderId);
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    await onAuditLog("delete_order", "order", orderNumber, { admin: adminName });
    toast.success(`Pedido ${orderNumber} eliminado`);
    if (selectedOrder?.id === orderId) setSelectedOrder(null);
    fetchOrders();

  const filtered = orders.filter((o) => {
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchFrom = !dateFrom || new Date(o.created_at) >= new Date(dateFrom);
    const matchTo = !dateTo || new Date(o.created_at) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = ["Nº Orden", "Fecha", "Cliente", "Email", "Teléfono", "Dirección", "Ciudad", "Estado", "CP", "Método pago", "Estado pago", "Estado pedido", "Subtotal", "Envío", "Total", "Gestionado por", "Entregado"];
    const rows = filtered.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleString("es-MX"),
      `${o.first_name} ${o.last_name}`,
      o.email, o.phone || "", o.address_line1, o.city, o.state, o.postal_code,
      o.payment_method, o.payment_status, STATUS_LABELS[o.status] || o.status,
      o.subtotal, o.shipping_cost, o.total,
      o.managed_by_name || "", o.delivered_at ? new Date(o.delivered_at).toLocaleString("es-MX") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-zyra-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV descargado");
  };

  // Print/PDF
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = filtered.map(o => `
      <tr>
        <td>${o.order_number}</td>
        <td>${new Date(o.created_at).toLocaleDateString("es-MX")}</td>
        <td>${o.first_name} ${o.last_name}</td>
        <td>${o.email}</td>
        <td>${STATUS_LABELS[o.status]}</td>
        <td style="text-align:right">$${o.total.toLocaleString()}</td>
        <td>${o.managed_by_name || "-"}</td>
      </tr>`).join("");
    printWindow.document.write(`
      <html><head><title>Pedidos ZYRA</title>
      <style>body{font-family:monospace;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:6px 8px;font-size:11px}th{background:#222;color:#fff;text-align:left}h1{font-size:16px;letter-spacing:4px}</style></head>
      <body><h1>ZYRA — PEDIDOS</h1><p>Generado: ${new Date().toLocaleString("es-MX")} · ${filtered.length} pedidos</p>
      <table><thead><tr><th>Orden</th><th>Fecha</th><th>Cliente</th><th>Email</th><th>Estado</th><th>Total</th><th>Gestionado por</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  // Manual order
  const generateOrderNumber = () => `ZYR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const addItemRow = () => setMItems(prev => [...prev, { name: "", ref: "", price: "", qty: "1" }]);
  const removeItemRow = (i: number) => setMItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    setMItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const saveManualOrder = async () => {
    if (!mFirstName || !mLastName || !mEmail) { toast.error("Nombre, apellido y email son requeridos"); return; }
    const validItems = mItems.filter(it => it.name && Number(it.price) > 0);
    if (validItems.length === 0) { toast.error("Agrega al menos un producto"); return; }

    setMSaving(true);
    const subtotal = validItems.reduce((sum, it) => sum + Number(it.price) * Number(it.qty || 1), 0);
    const orderNumber = generateOrderNumber();

    const { data: orderData, error: orderErr } = await supabase.from("orders").insert({
      order_number: orderNumber,
      first_name: mFirstName, last_name: mLastName, email: mEmail, phone: mPhone || null,
      address_line1: mAddress || "Pedido manual", city: mCity || "N/A", state: mState || "N/A",
      postal_code: mPostal || "00000",
      subtotal, shipping_cost: 0, total: subtotal,
      payment_method: "manual", payment_status: "paid", status: "confirmed",
      managed_by: adminUserId, managed_by_name: adminName,
    } as any).select().single();

    if (orderErr || !orderData) { toast.error(orderErr?.message || "Error"); setMSaving(false); return; }

    const items = validItems.map(it => ({
      order_id: orderData.id,
      product_name: it.name,
      product_reference: it.ref || null,
      price: Number(it.price),
      quantity: Number(it.qty || 1),
      subtotal: Number(it.price) * Number(it.qty || 1),
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) toast.error(itemsErr.message);
    else {
      toast.success(`Pedido ${orderNumber} creado`);
      await onAuditLog("create_manual_order", "order", orderNumber, { total: subtotal, admin: adminName });
      setShowManual(false);
      resetManualForm();
      fetchOrders();
    }
    setMSaving(false);
  };

  const resetManualForm = () => {
    setMFirstName(""); setMLastName(""); setMEmail(""); setMPhone("");
    setMAddress(""); setMCity(""); setMState(""); setMPostal("");
    setMItems([{ name: "", ref: "", price: "", qty: "1" }]);
  };

  // ORDER DETAIL VIEW
  if (selectedOrder) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => setSelectedOrder(null)} className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          <ChevronLeft size={14} /> Volver
        </button>
        <div className="border border-foreground/[0.08] p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="font-mono text-base md:text-lg text-foreground">{selectedOrder.order_number}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">{new Date(selectedOrder.created_at).toLocaleString("es-MX")}</p>
              {selectedOrder.managed_by_name && (
                <p className="font-mono text-[10px] text-accent mt-1">Gestionado por: {selectedOrder.managed_by_name}</p>
              )}
              {selectedOrder.delivered_at && (
                <p className="font-mono text-[10px] text-accent mt-1 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Entregado: {new Date(selectedOrder.delivered_at).toLocaleString("es-MX")}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <select value={selectedOrder.status} onChange={(e) => updateStatus(selectedOrder.id, e.target.value)} className={inputClass + " !w-full sm:!w-auto"}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              {selectedOrder.status !== "delivered" && (
                <button onClick={() => updateStatus(selectedOrder.id, "delivered")} className="h-10 px-4 bg-accent text-accent-foreground font-sans text-[10px] uppercase tracking-[0.15em] hover:bg-accent/80 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Marcar entregado
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Cliente</p>
              <p className="font-sans text-sm text-foreground">{selectedOrder.first_name} {selectedOrder.last_name}</p>
              <p className="font-sans text-sm text-muted-foreground break-all">{selectedOrder.email}</p>
              {selectedOrder.phone && <p className="font-sans text-sm text-muted-foreground">{selectedOrder.phone}</p>}
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Dirección de envío</p>
              <p className="font-sans text-sm text-foreground">{selectedOrder.address_line1}</p>
              {selectedOrder.address_line2 && <p className="font-sans text-sm text-foreground">{selectedOrder.address_line2}</p>}
              <p className="font-sans text-sm text-foreground">{selectedOrder.city}, {selectedOrder.state} {selectedOrder.postal_code}</p>
              <p className="font-sans text-sm text-muted-foreground">{selectedOrder.country}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Pago</p>
              <p className="font-sans text-sm text-foreground">Método: {selectedOrder.payment_method === "mercadopago" ? "Mercado Pago" : selectedOrder.payment_method === "manual" ? "Manual" : "Tarjeta"}</p>
              <p className="font-sans text-sm text-foreground">Estado: <span className={selectedOrder.payment_status === "paid" ? "text-accent" : "text-muted-foreground"}>{selectedOrder.payment_status}</span></p>
              {selectedOrder.payment_reference && <p className="font-mono text-[10px] text-muted-foreground mt-1">Ref: {selectedOrder.payment_reference}</p>}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Productos</p>
            <div className="border border-foreground/[0.08]">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-foreground/[0.08] last:border-b-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 object-cover bg-secondary flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-sans text-sm text-foreground truncate">{item.product_name}</p>
                      {item.product_reference && <p className="font-mono text-[10px] text-muted-foreground">{item.product_reference}</p>}
                      <p className="font-mono text-[10px] text-muted-foreground">x{item.quantity} · ${item.price.toLocaleString()} c/u</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm tabular-nums text-foreground ml-3">${item.subtotal.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="text-right space-y-1">
              <p className="font-sans text-sm text-muted-foreground">Subtotal: <span className="font-mono tabular-nums text-foreground">${selectedOrder.subtotal.toLocaleString()}</span></p>
              <p className="font-sans text-sm text-muted-foreground">Envío: <span className="font-mono tabular-nums text-foreground">${selectedOrder.shipping_cost.toLocaleString()}</span></p>
              <p className="font-mono text-lg text-foreground tabular-nums">Total: ${selectedOrder.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MANUAL ORDER FORM
  if (showManual) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => { setShowManual(false); resetManualForm(); }} className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          <ChevronLeft size={14} /> Volver
        </button>
        <div className="border border-foreground/[0.08] p-4 md:p-6 space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nuevo pedido manual</p>

          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Datos del cliente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Nombre *" value={mFirstName} onChange={(e) => setMFirstName(e.target.value)} className={inputClass} />
              <input placeholder="Apellido *" value={mLastName} onChange={(e) => setMLastName(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Email *" type="email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} className={inputClass} />
              <input placeholder="Teléfono" value={mPhone} onChange={(e) => setMPhone(e.target.value)} className={inputClass} />
            </div>
            <input placeholder="Dirección" value={mAddress} onChange={(e) => setMAddress(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <input placeholder="Ciudad" value={mCity} onChange={(e) => setMCity(e.target.value)} className={inputClass} />
              <input placeholder="Estado" value={mState} onChange={(e) => setMState(e.target.value)} className={inputClass} />
              <input placeholder="C.P." value={mPostal} onChange={(e) => setMPostal(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">Productos</p>
            {mItems.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 items-start">
                <input placeholder="Producto *" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} className={inputClass + " sm:flex-[2]"} />
                <input placeholder="Ref." value={item.ref} onChange={(e) => updateItem(i, "ref", e.target.value)} className={inputClass + " sm:flex-1"} />
                <input placeholder="Precio *" type="number" value={item.price} onChange={(e) => updateItem(i, "price", e.target.value)} className={inputClass + " sm:w-28"} />
                <input placeholder="Cant." type="number" value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} className={inputClass + " sm:w-20"} />
                {mItems.length > 1 && (
                  <button onClick={() => removeItemRow(i)} className="p-3 text-muted-foreground hover:text-destructive self-center"><X size={14} /></button>
                )}
              </div>
            ))}
            <button onClick={addItemRow} className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-foreground transition-colors inline-flex items-center gap-1">
              <Plus size={12} /> Agregar producto
            </button>
          </div>

          <div className="text-right">
            <p className="font-mono text-lg text-foreground tabular-nums">
              Total: ${mItems.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1), 0).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={saveManualOrder} disabled={mSaving} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 flex-1 sm:flex-none">
              {mSaving ? "Guardando..." : "Crear pedido"}
            </button>
            <button onClick={() => { setShowManual(false); resetManualForm(); }} className="h-12 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors flex-1 sm:flex-none">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ORDERS LIST
  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setShowManual(true)} className="h-12 px-6 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors inline-flex items-center justify-center gap-2">
          <Plus size={14} /> Pedido manual
        </button>
        <button onClick={exportCSV} className="h-12 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors inline-flex items-center justify-center gap-2">
          <Download size={14} /> Excel/CSV
        </button>
        <button onClick={exportPDF} className="h-12 px-6 border border-foreground/[0.08] text-muted-foreground font-sans text-[10px] uppercase tracking-[0.2em] hover:text-foreground transition-colors inline-flex items-center justify-center gap-2">
          <FileText size={14} /> PDF
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por orden, cliente, email..." className={inputClass + " !pl-9"} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass + " sm:!w-40"}>
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass + " flex-1"} />
          <span className="font-mono text-[10px] text-muted-foreground">a</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass + " flex-1"} />
        </div>
      </div>

      {/* Results count */}
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
        {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>

      {loading ? (
        <p className="font-sans text-sm text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">Sin pedidos.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((order) => (
              <button key={order.id} onClick={() => viewDetails(order)} className="w-full text-left p-4 border border-foreground/[0.08] bg-secondary/20 space-y-2 active:bg-secondary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{order.order_number}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${order.status === "delivered" ? "text-accent" : order.status === "cancelled" ? "text-destructive" : "text-muted-foreground"}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="font-sans text-sm text-foreground">{order.first_name} {order.last_name}</p>
                <p className="font-mono text-[10px] text-muted-foreground break-all">{order.email}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("es-MX")}</span>
                  <span className="font-mono text-sm tabular-nums text-foreground">${order.total.toLocaleString()}</span>
                </div>
                {order.managed_by_name && (
                  <p className="font-mono text-[10px] text-accent">Por: {order.managed_by_name}</p>
                )}
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block border border-foreground/[0.08] overflow-x-auto">
            <div className="grid grid-cols-[120px_1fr_1fr_100px_100px_100px_100px_auto] gap-3 px-4 py-3 border-b border-foreground/[0.08] bg-secondary/30 min-w-[800px]">
              {["Orden", "Cliente", "Email", "Fecha", "Total", "Estado", "Admin", ""].map((h) => (
                <span key={h} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{h}</span>
              ))}
            </div>
            {filtered.map((order) => (
              <div key={order.id} className="grid grid-cols-[120px_1fr_1fr_100px_100px_100px_100px_auto] gap-3 px-4 py-3 border-b border-foreground/[0.08] last:border-b-0 items-center min-w-[800px]">
                <span className="font-mono text-xs text-foreground">{order.order_number}</span>
                <span className="font-sans text-sm text-foreground truncate">{order.first_name} {order.last_name}</span>
                <span className="font-mono text-[10px] text-muted-foreground truncate">{order.email}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("es-MX")}</span>
                <span className="font-mono text-sm tabular-nums text-foreground">${order.total.toLocaleString()}</span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="bg-transparent font-mono text-[10px] uppercase text-muted-foreground border-none focus:outline-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <span className="font-mono text-[10px] text-accent truncate">{order.managed_by_name || "-"}</span>
                <button onClick={() => viewDetails(order)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Eye size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrdersDB;
