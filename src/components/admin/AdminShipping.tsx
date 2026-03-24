import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { DEFAULT_SHIPPING_RATES, ShippingRate } from "@/data/argentinaData";

interface Props {
  inputClass: string;
  onAuditLog: (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => Promise<void>;
}

const AdminShipping = ({ inputClass, onAuditLog }: Props) => {
  const [rates, setRates] = useState<ShippingRate[]>(DEFAULT_SHIPPING_RATES);
  const [freeShippingMin, setFreeShippingMin] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping_rates")
      .maybeSingle();
    if (data?.value) {
      const val = data.value as any;
      if (val.rates) setRates(val.rates);
      if (val.freeShippingMin !== undefined) setFreeShippingMin(val.freeShippingMin);
    }
    setLoading(false);
  };

  const updateRate = (index: number, field: keyof ShippingRate, value: string | number) => {
    setRates((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: typeof value === "string" && field !== "label" ? Number(value) : value } : r
      )
    );
  };

  const addRate = () => {
    setRates((prev) => [...prev, { label: "", cpMin: 0, cpMax: 0, cost: 0 }]);
  };

  const removeRate = (index: number) => {
    setRates((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    const value = { rates, freeShippingMin };
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "shipping_rates")
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("site_settings")
        .update({ value: value as any })
        .eq("key", "shipping_rates"));
    } else {
      ({ error } = await supabase
        .from("site_settings")
        .insert({ key: "shipping_rates", value: value as any }));
    }

    if (error) {
      toast.error("Error guardando tarifas: " + error.message);
    } else {
      toast.success("Tarifas de envío actualizadas");
      await onAuditLog("update_shipping_rates", "settings", "shipping_rates", { rates: rates.length });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          Tarifas de envío por código postal
        </h3>
        <p className="font-sans text-xs text-muted-foreground mb-6">
          Configurá los rangos de código postal y el costo de envío para cada zona.
        </p>
      </div>

      <div className="space-y-3">
        {rates.map((rate, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-end">
            <div className="space-y-1">
              {i === 0 && <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Zona</label>}
              <input
                value={rate.label}
                onChange={(e) => updateRate(i, "label", e.target.value)}
                placeholder="Zona"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">CP desde</label>}
              <input
                type="number"
                value={rate.cpMin}
                onChange={(e) => updateRate(i, "cpMin", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">CP hasta</label>}
              <input
                type="number"
                value={rate.cpMax}
                onChange={(e) => updateRate(i, "cpMax", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              {i === 0 && <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Costo ($)</label>}
              <input
                type="number"
                value={rate.cost}
                onChange={(e) => updateRate(i, "cost", e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              onClick={() => removeRate(i)}
              className="h-12 px-3 border border-foreground/[0.08] text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition-colors font-mono text-[10px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRate}
        className="h-10 px-4 border border-dashed border-foreground/[0.12] text-muted-foreground hover:text-foreground hover:border-foreground/20 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors"
      >
        + Agregar zona
      </button>

      <div className="border-t border-foreground/[0.08] pt-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Envío gratis
        </h3>
        <div className="space-y-1 max-w-xs">
          <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            Monto mínimo para envío gratis ($0 = deshabilitado)
          </label>
          <input
            type="number"
            value={freeShippingMin}
            onChange={(e) => setFreeShippingMin(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="h-12 px-8 bg-foreground text-background font-sans font-medium uppercase tracking-[0.2em] text-[10px] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 inline-flex items-center gap-2"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Guardar tarifas
      </button>
    </div>
  );
};

export default AdminShipping;
