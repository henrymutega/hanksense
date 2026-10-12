import { useAuth, signOut, type AppRole } from "@/lib/auth";
import { LogOut, Repeat, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function UserMenu() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, role, roles, switchRole, refreshRole } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const initials = (user.user_metadata?.full_name || user.email || "U").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel: Record<string, string> = {
    admin: t("common.admin"),
    lecturer: t("auth.lecturer"),
    student: t("auth.student"),
    individual: t("auth.individual", { defaultValue: "Individual" }),
  };
  const canAddIndividual = (role === "lecturer" || role === "student") && !roles.includes("individual");

  function go(r: AppRole) { switchRole(r); nav({ to: "/" }); }

  async function addIndividual() {
    setBusy(true);
    const { error } = await supabase.rpc("add_individual_workspace" as any);
    if (error) { setBusy(false); toast.error(error.message); return; }
    await refreshRole();
    switchRole("individual");
    setBusy(false);
    toast.success(t("auth.individualAdded", { defaultValue: "Individual workspace added. Switch workspaces anytime from the menu." }));
    nav({ to: "/" });
  }

  return (
    <div className="p-3 border-t border-sidebar-border space-y-2">
      {roles.length > 1 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 mb-1 flex items-center gap-1"><Repeat className="w-3 h-3" />{t("auth.workspace", { defaultValue: "Workspace" })}</div>
          <select
            value={role ?? ""}
            onChange={e => go(e.target.value as AppRole)}
            className="w-full bg-sidebar-accent text-sidebar-accent-foreground text-xs rounded px-2 py-1.5 border border-sidebar-border"
          >
            {roles.map(r => <option key={r} value={r}>{roleLabel[r] || r}</option>)}
          </select>
        </div>
      )}
      {canAddIndividual && (
        <button disabled={busy} onClick={addIndividual} className="w-full flex items-center justify-center gap-1.5 text-xs rounded border border-sidebar-border py-1.5 hover:bg-sidebar-accent text-sidebar-foreground/80">
          <Plus className="w-3 h-3" />{t("auth.addIndividual", { defaultValue: "Add CV Coach (Individual)" })}
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-sidebar-accent grid place-items-center text-sidebar-accent-foreground font-semibold text-xs">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate text-sidebar-foreground flex items-center gap-1.5">
            <span className="truncate">{user.user_metadata?.full_name || user.email}</span>
            {roles.includes("admin") && (
              <span className="shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">{t("common.admin")}</span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">{role ? (roleLabel[role] || role) : t("common.noRole")}</div>
        </div>
        <button onClick={signOut} className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/70" title={t("common.signout")}><LogOut className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
