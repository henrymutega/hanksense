import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";

function ResetPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Detect a recovery link either from the URL hash/query or from the auth event.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    const q = window.location.search;
    if (h.includes("type=recovery") || q.includes("type=recovery") || h.includes("access_token")) setMode("update");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) toast.error(error.message);
    else { setSent(true); toast.success(t("auth.resetSent")); }
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error(t("auth.passwordTooShort"));
    if (pw !== pw2) return toast.error(t("auth.passwordsDontMatch"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(t("auth.pwUpdated")); window.location.href = "/"; }
  }

  const mismatch = pw2.length > 0 && pw !== pw2;

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="font-semibold mb-1">{mode === "request" ? t("auth.resetTitle") : t("auth.setNewTitle")}</div>
        <div className="text-xs text-muted-foreground mb-5">{mode === "request" ? t("auth.resetHint") : t("auth.setNewDesc")}</div>

        {mode === "request" ? (
          sent ? (
            <div className="text-sm text-muted-foreground bg-accent/40 border border-border rounded-md p-4">
              {t("auth.resetSent")}
            </div>
          ) : (
            <form onSubmit={request} className="space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-base sm:text-sm"
              />
              <button disabled={busy} className="w-full min-h-11 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
                {busy ? t("common.sending") : t("auth.sendResetLink")}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={update} className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t("auth.newPassword")}
                value={pw}
                onChange={e => setPw(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-3 pr-11 py-2.5 text-base sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute inset-y-0 right-0 px-3 grid place-items-center text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input
              type={showPw ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder={t("auth.confirmNewPassword")}
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              className={`w-full bg-background border rounded-md px-3 py-2.5 text-base sm:text-sm ${mismatch ? "border-destructive" : "border-border"}`}
            />
            {mismatch && <p className="text-[11px] text-destructive">{t("auth.passwordsDontMatch")}</p>}
            <button disabled={busy || mismatch} className="w-full min-h-11 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
              {busy ? t("auth.updating") : t("auth.updatePassword")}
            </button>
          </form>
        )}

        <div className="text-xs text-center mt-5"><Link to="/login" className="text-primary">{t("auth.backToSignIn")}</Link></div>
      </div>
    </div>
  );
}

export default ResetPage;
