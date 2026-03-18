import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  update_profile: "Actualizó perfil",
  change_password: "Cambió contraseña",
  change_email: "Cambió email",
  create_admin: "Creó administrador",
  update_order_status: "Cambió estado de pedido",
  create_manual_order: "Creó pedido manual",
  mark_delivered: "Marcó como entregado",
  update_contact: "Actualizó contacto",
  update_hero: "Actualizó hero",
  create_product: "Creó producto",
  update_product: "Actualizó producto",
  delete_product: "Eliminó producto",
  create_category: "Creó categoría",
  update_category: "Actualizó categoría",
  delete_category: "Eliminó categoría",
};

interface AuditEntry {
  id: string;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLog();
  }, []);

  const fetchLog = async () => {
    const { data } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setEntries((data as AuditEntry[]) || []);
    setLoading(false);
  };

  if (loading) return <p className="font-sans text-sm text-muted-foreground">Cargando registro...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Registro de modificaciones ({entries.length})
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">Sin registros aún.</p>
      ) : (
        <div className="border border-foreground/[0.08]">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 border-b border-foreground/[0.08] last:border-b-0">
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                {new Date(entry.created_at).toLocaleString("es-MX")}
              </span>
              <span className="font-sans text-xs text-accent font-medium whitespace-nowrap">
                {entry.admin_name || "Admin"}
              </span>
              <span className="font-sans text-sm text-foreground">
                {ACTION_LABELS[entry.action] || entry.action}
              </span>
              {entry.entity_id && (
                <span className="font-mono text-[10px] text-muted-foreground truncate">
                  {entry.entity_id}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
