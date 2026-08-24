import { useAuth, signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

export function UserMenu() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  if (!user) return null;
  const initials = (user.user_metadata?.full_name || user.email || "U").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel: Record<string, string> = {
    admin: t("common.admin"),
    lecturer: t("auth.lecturer"),
    student: t("auth.student"),
  };
  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-sidebar-accent grid place-items-center text-sidebar-accent-foreground font-semibold text-xs">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate text-sidebar-foreground flex items-center gap-1.5">
            <span className="truncate">{user.user_metadata?.full_name || user.email}</span>
            {role === "admin" && (
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
