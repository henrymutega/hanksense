import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/auth";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";



function SelectRolePage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, role, refreshRole } = useAuth();
  const [pick, setPick] = useState<"lecturer" | "student">("lecturer");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) { nav({ to: "/login" }); return null; }
  if (role) { nav({ to: "/" }); return null; }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pick === "student" && !code.trim()) { toast.error(t("auth.enterSessionCode")); return; }
    setBusy(true);
    const { error } = await supabase.rpc("assign_self_role", { _role: pick });
    if (error) { setBusy(false); toast.error(error.message); return; }
    if (pick === "student") {
      const c = code.trim().toUpperCase();
      const { error: re } = await supabase.rpc("redeem_session_code", { _code: c });
      if (re) {
        const { error: e2 } = await supabase.rpc("redeem_class_invite", { _code: c });
        if (e2) { setBusy(false); toast.error(re.message); return; }
      }
    }
    await refreshRole();
    toast.success(t("auth.welcome", { role: pick === "lecturer" ? t("auth.lecturer") : t("auth.student") }));
    nav({ to: "/" });
  }

  const roleText = pick === "lecturer" ? t("auth.lecturer") : t("auth.student");

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary grid place-items-center"><Sparkles className="w-5 h-5 text-primary-foreground" /></div>
          <div><div className="font-semibold">{t("auth.finishSetup")}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("auth.chooseRole")}</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button type="button" onClick={() => setPick("lecturer")} className={`flex flex-col items-center gap-1 border rounded-lg py-3 text-xs ${pick === "lecturer" ? "border-primary bg-primary/10" : "border-border"}`}>
            <BookOpen className="w-4 h-4" /> {t("auth.lecturer")}
          </button>
          <button type="button" onClick={() => setPick("student")} className={`flex flex-col items-center gap-1 border rounded-lg py-3 text-xs ${pick === "student" ? "border-primary bg-primary/10" : "border-border"}`}>
            <GraduationCap className="w-4 h-4" /> {t("auth.student")}
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {pick === "student" && (
            <input required placeholder={t("auth.sessionCode")} value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm uppercase tracking-widest" />
          )}
          <button disabled={busy} className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium">{busy ? t("common.saving") : t("auth.continueAs", { role: roleText })}</button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-4 text-center">
          {pick === "lecturer" ? t("auth.lecturerNote") : t("auth.studentNote")}
        </p>
        <button onClick={signOut} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground">{t("auth.signOut")}</button>
      </div>
    </div>
  );
}

export default SelectRolePage;
