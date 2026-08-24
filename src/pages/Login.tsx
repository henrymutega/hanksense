import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

function LoginPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/" }); }, [user, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) toast.error(error.message); else nav({ to: "/" });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(String((r as any).error?.message ?? r.error));
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary grid place-items-center shrink-0"><Sparkles className="w-5 h-5 text-primary-foreground" /></div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{t("nav.brand")}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("auth.signIn")}</div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.email")}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-base sm:text-sm"
          />
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder={t("auth.password")}
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
          <div className="text-right">
            <Link to="/reset-password" className="text-xs text-primary hover:underline">{t("auth.forgotPassword")}</Link>
          </div>
          <button disabled={busy} className="w-full min-h-11 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50">
            {busy ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>
        <button onClick={google} className="w-full min-h-11 mt-3 border border-border rounded-md py-2.5 text-sm hover:bg-accent">{t("auth.google")}</button>
        <div className="text-xs text-center mt-5 text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/signup" search={{ code: "", role: "" as const }} className="text-primary">{t("auth.createAccount")}</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
