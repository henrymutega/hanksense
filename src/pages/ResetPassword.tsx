import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PublicNav } from "@/components/PublicNav";
import { Eye, EyeOff } from "lucide-react";

const inputCls = "w-full bg-background border border-border rounded-md px-3 py-2.5 text-base sm:text-sm";

function ResetPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  function errMsg(err: { message?: string; status?: number; code?: string } | null | undefined): string {
    const m = (err?.message || "").toLowerCase();
    const c = (err?.code || "").toLowerCase();
    if (err?.status === 429 || m.includes("rate limit") || m.includes("security purposes") || c.includes("rate_limit")) return t("auth.tooManyRequests");
    if (c === "same_password" || m.includes("different from the old")) return t("auth.samePassword");
    if (m.includes("session") || c.includes("session")) return t("auth.sessionExpired");
    if (m.includes("expired") || m.includes("invalid") || c.includes("otp")) return t("auth.codeInvalid");
    if (m.includes("at least") || c === "weak_password") return t("auth.passwordTooShort");
    return t("auth.resetFailed");
  }

  async function sendCode(): Promise<boolean> {
    const addr = email.trim();
    const { data: status, error: sErr } = await supabase.rpc("email_signup_status" as any, { _email: addr });
    if (sErr) { toast.error(errMsg(sErr)); return false; }
    if (status === "none") { toast.error(t("auth.emailNotFound")); return false; }
    const { error } = await supabase.auth.resetPasswordForEmail(addr);
    if (error) { toast.error(errMsg(error)); return false; }
    return true;
  }

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await sendCode();
    setBusy(false);
    if (ok) { setStep("code"); toast.success(t("auth.codeSent")); }
  }

  async function resend() {
    setBusy(true);
    const ok = await sendCode();
    setBusy(false);
    if (ok) toast.success(t("auth.codeSent"));
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length < 6) return toast.error(t("auth.codeInvalid"));
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "recovery" });
    setBusy(false);
    if (error) return toast.error(t("auth.codeInvalid"));
    setStep("password");
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error(t("auth.passwordTooShort"));
    if (pw !== pw2) return toast.error(t("auth.passwordsDontMatch"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(t("auth.pwUpdated"));
    nav({ to: "/" });
  }

  const mismatch = pw2.length > 0 && pw !== pw2;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <div className="flex-1 grid place-items-center p-4 sm:p-6">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="font-semibold mb-1">{step === "password" ? t("auth.setNewTitle") : t("auth.resetTitle")}</div>
          <div className="text-xs text-muted-foreground mb-5">
            {step === "email" ? t("auth.resetHint") : step === "code" ? t("auth.resetCodeSent", { email: email.trim() }) : t("auth.setNewDesc")}
          </div>

          {step === "email" && (
            <form onSubmit={request} className="space-y-3">
              <input type="email" required autoComplete="email" placeholder={t("auth.email")}
                value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              <button type="submit" disabled={busy} className="w-full min-h-11 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
                {busy ? t("common.sending") : t("auth.sendResetCode")}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verify} className="space-y-3">
              <input inputMode="numeric" autoComplete="one-time-code" required maxLength={10}
                placeholder={t("auth.resetCodeLabel")} value={code}
                onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                className={`${inputCls} text-center tracking-[0.4em] font-semibold`} />
              <button type="submit" disabled={busy} className="w-full min-h-11 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
                {busy ? t("auth.verifying") : t("auth.verifyBtn")}
              </button>
              <div className="flex justify-between text-xs pt-1">
                <button type="button" disabled={busy} onClick={resend} className="text-primary disabled:opacity-50">{t("auth.resendCode")}</button>
                <button type="button" onClick={() => { setStep("email"); setCode(""); }} className="text-muted-foreground hover:text-foreground">{t("auth.useDifferentEmail")}</button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={update} className="space-y-3">
              <div className="relative">
                <input type={showPw ? "text" : "password"} required minLength={6} autoComplete="new-password"
                  placeholder={t("auth.newPassword")} value={pw} onChange={e => setPw(e.target.value)}
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                  className="absolute inset-y-0 right-0 px-3 grid place-items-center text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input type={showPw ? "text" : "password"} required minLength={6} autoComplete="new-password"
                placeholder={t("auth.confirmNewPassword")} value={pw2} onChange={e => setPw2(e.target.value)}
                className={`${inputCls} ${mismatch ? "border-destructive" : ""}`} />
              {mismatch && <p className="text-[11px] text-destructive">{t("auth.passwordsDontMatch")}</p>}
              <button type="submit" disabled={busy || mismatch} className="w-full min-h-11 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
                {busy ? t("auth.updating") : t("auth.updatePassword")}
              </button>
            </form>
          )}

          <div className="text-xs text-center mt-5"><Link to="/login" className="text-primary">{t("auth.backToSignIn")}</Link></div>
        </div>
      </div>
    </div>
  );
}

export default ResetPage;
