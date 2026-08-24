
import { Clock, LogOut } from "lucide-react";
import { signOut, useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import { useTranslation } from "react-i18next";



function PendingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { accountStatus } = useLecturerState();
  const suspended = accountStatus === "suspended";
  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 grid place-items-center mb-4">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-semibold text-lg mb-1">{suspended ? t("auth.suspendedTitle") : t("auth.pendingTitle")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {suspended ? t("auth.suspendedDesc") : t("auth.pendingDesc")}
        </p>
        <div className="text-xs text-muted-foreground mb-4">{user?.email}</div>
        <button onClick={signOut} className="w-full border border-border rounded-md py-2 text-sm hover:bg-accent inline-flex items-center justify-center gap-2"><LogOut className="w-4 h-4" />{t("common.signout")}</button>
      </div>
    </div>
  );
}

export default PendingPage;
