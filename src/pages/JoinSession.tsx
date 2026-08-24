import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/auth";
import { toast } from "sonner";
import { GraduationCap, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";



function JoinSessionPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, role } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  // If not a student, get out.
  useEffect(() => {
    if (user && role && role !== "student") nav({ to: "/" });
  }, [user, role, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return toast.error("Please enter a session or class code");
    setBusy(true);
    const { error: re } = await supabase.rpc("redeem_session_code", { _code: c });
    if (re) {
      const { error: e2 } = await supabase.rpc("redeem_class_invite", { _code: c });
      if (e2) { setBusy(false); toast.error(re.message || e2.message); return; }
    }
    toast.success("Joined successfully");
    // Full reload so gate re-evaluates membership
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary grid place-items-center"><GraduationCap className="w-5 h-5 text-primary-foreground" /></div>
          <div>
            <div className="font-semibold">Join your lecturer's class</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Student access</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Students on the platform must belong to a lecturer through a class or session. Enter the code your lecturer shared with you to continue.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              autoFocus
              placeholder={t("auth.sessionCode")}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm uppercase tracking-widest"
            />
          </div>
          <button disabled={busy} className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium">
            {busy ? t("common.saving") : "Join class"}
          </button>
        </form>
        <button onClick={signOut} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground">
          {t("common.signout")}
        </button>
      </div>
    </div>
  );
}

export default JoinSessionPage;
