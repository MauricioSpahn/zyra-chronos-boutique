import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, UserPlus, User } from "lucide-react";

interface Props {
  inputClass: string;
  adminUserId: string;
  onAuditLog: (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => Promise<void>;
}

const AdminAccount = ({ inputClass, adminUserId, onAuditLog }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // New admin form
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFirst, setNewAdminFirst] = useState("");
  const [newAdminLast, setNewAdminLast] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [adminUserId]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentEmail(user.email || "");

    const { data } = await supabase.from("admin_profiles").select("*").eq("user_id", adminUserId).maybeSingle();
    if (data) {
      setFirstName((data as any).first_name || "");
      setLastName((data as any).last_name || "");
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("admin_profiles").select("id").eq("user_id", adminUserId).maybeSingle();

    if (existing) {
      await supabase.from("admin_profiles").update({
        first_name: firstName,
        last_name: lastName,
      } as any).eq("user_id", adminUserId);
    } else {
      await supabase.from("admin_profiles").insert({
        user_id: adminUserId,
        first_name: firstName,
        last_name: lastName,
      } as any);
    }
    await onAuditLog("update_profile", "admin_profile", adminUserId, { first_name: firstName, last_name: lastName });
    toast.success("Perfil actualizado");
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Contraseña actualizada");
      setNewPassword("");
      setConfirmPassword("");
      await onAuditLog("change_password", "admin_account", adminUserId);
    }
    setSaving(false);
  };

  const changeEmail = async () => {
    if (!newEmail) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message);
    else {
      toast.success("Se envió un correo de confirmación al nuevo email");
      await onAuditLog("change_email", "admin_account", adminUserId, { new_email: newEmail });
      setNewEmail("");
    }
    setSaving(false);
  };

  const createNewAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminFirst || !newAdminLast) {
      toast.error("Todos los campos son requeridos");
      return;
    }
    if (newAdminPassword.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }

    setCreatingAdmin(true);
    const { data, error } = await supabase.functions.invoke("create-admin", {
      body: { email: newAdminEmail, password: newAdminPassword, firstName: newAdminFirst, lastName: newAdminLast },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Error creando administrador");
    } else {
      toast.success(`Administrador ${newAdminFirst} ${newAdminLast} creado`);
      await onAuditLog("create_admin", "admin_account", data?.user_id, {
        email: newAdminEmail,
        name: `${newAdminFirst} ${newAdminLast}`,
      });
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminFirst("");
      setNewAdminLast("");
    }
    setCreatingAdmin(false);
  };

  return (
    <div className="space-y-10 max-w-xl">
      {/* Profile */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mi perfil</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Nombre</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Nombre" />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Apellido</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Apellido" />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar perfil"}
        </button>
      </div>

      {/* Change email */}
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cambiar correo electrónico</p>
        <p className="font-sans text-xs text-muted-foreground">Email actual: <span className="text-foreground">{currentEmail}</span></p>
        <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} placeholder="Nuevo email" type="email" />
        <button onClick={changeEmail} disabled={saving || !newEmail} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
          Cambiar email
        </button>
      </div>

      {/* Change password */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cambiar contraseña</p>
        </div>
        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Nueva contraseña" type="password" />
        <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Confirmar contraseña" type="password" />
        <button onClick={changePassword} disabled={saving || !newPassword} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
          Cambiar contraseña
        </button>
      </div>

      {/* Create new admin */}
      <div className="space-y-4 border-t border-foreground/[0.08] pt-8">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Crear nueva cuenta de administrador</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={newAdminFirst} onChange={(e) => setNewAdminFirst(e.target.value)} className={inputClass} placeholder="Nombre *" />
          <input value={newAdminLast} onChange={(e) => setNewAdminLast(e.target.value)} className={inputClass} placeholder="Apellido *" />
        </div>
        <input value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className={inputClass} placeholder="Email *" type="email" />
        <input value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className={inputClass} placeholder="Contraseña *" type="password" />
        <button onClick={createNewAdmin} disabled={creatingAdmin} className="h-12 px-6 bg-foreground text-background font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
          {creatingAdmin ? "Creando..." : "Crear administrador"}
        </button>
      </div>
    </div>
  );
};

export default AdminAccount;
