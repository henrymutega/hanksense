import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Sparkles, GraduationCap, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";



function SignupPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const search = useSearch({ from: "/signup" });
  const { user, refreshRole } = useAuth();
  const [role, setRole] = useState<"lecturer" | "student">(search.role || "lecturer");
  const [code, setCode] = useState(search.code || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeCheck, setCodeCheck] = useState<{ state: "idle" | "checking" | "valid" | "invalid"; lecturer?: string; className?: string }>({ state: "idle" });

  // Live verify the student code against a lecturer in the system
  useEffect(() => {
    if (role !== "student") { setCodeCheck({ state: "idle" }); return; }
    const c = code.trim().toUpperCase();
    if (c.length < 4) { setCodeCheck({ state: "idle" }); return; }
    setCodeCheck({ state: "checking" });
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("validate_student_code", { _code: c });
      const row: any = Array.isArray(data) ? data[0] : data;
      if (error || !row) setCodeCheck({ state: "invalid" });
      else setCodeCheck({ state: "valid", lecturer: row.lecturer_name, className: row.class_name });
    }, 350);
    return () => clearTimeout(t);
  }, [code, role]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      if (role === "student" && code) {
        await supabase.rpc("assign_self_role", { _role: "student" });
        const c = code.trim().toUpperCase();
        const { error } = await supabase.rpc("redeem_session_code", { _code: c });
        if (error) {
          const { error: e2 } = await supabase.rpc("redeem_class_invite", { _code: c });
          if (e2) toast.error(error.message);
        }
        await refreshRole();
      }
      nav({ to: "/" });
    })();
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return toast.error(t("auth.passwordsDontMatch"));
    if (role === "student" && !code.trim()) return toast.error(t("auth.enterSessionCode"));
    setBusy(true);

    // Streamlined: for students, verify the code matches a lecturer BEFORE creating an account.
    if (role === "student") {
      const c = code.trim().toUpperCase();
      const { data: match, error: vErr } = await supabase.rpc("validate_student_code", { _code: c });
      if (vErr || !match || (Array.isArray(match) && match.length === 0)) {
        setBusy(false);
        toast.error("Invalid class code. Please use the code your lecturer provided.");
        return;
      }
      const row: any = Array.isArray(match) ? match[0] : match;
      toast.success(`Code verified — joining ${row.lecturer_name || "your lecturer"}'s class`);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    if (error) { setBusy(false); toast.error(error.message); return; }

    if (data.session) {
      await supabase.rpc("assign_self_role", { _role: role });
      // write profile extras
      await supabase.from("profiles").update({
        full_name: name,
        institution: institution || null,
        department: department || null,
        phone: phone || null,
        student_id: role === "student" ? studentId || null : null,
      }).eq("id", data.user!.id);

      if (role === "student") {
        const c = code.trim().toUpperCase();
        const { error: re } = await supabase.rpc("redeem_session_code", { _code: c });
        if (re) {
          const { error: e2 } = await supabase.rpc("redeem_class_invite", { _code: c });
          if (e2) {
            toast.error(re.message || e2.message);
            setBusy(false);
            // Student without a valid attachment cannot proceed
            await supabase.auth.signOut();
            return;
          }
        }
      }
      await refreshRole();
      nav({ to: "/" });
    } else {
      toast.success(t("auth.checkEmail"));
      nav({ to: "/login" });
    }
    setBusy(false);
  }

  async function google() {
    sessionStorage.setItem("pending_role", role);
    if (role === "student" && code) sessionStorage.setItem("pending_invite", code);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(String((r as any).error?.message ?? r.error));
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary grid place-items-center"><Sparkles className="w-5 h-5 text-primary-foreground" /></div>
          <div><div className="font-semibold">{t("nav.brand")}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("auth.createAccount")}</div></div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button type="button" onClick={() => setRole("lecturer")} className={`flex flex-col items-center gap-1 border rounded-lg py-3 text-xs ${role === "lecturer" ? "border-primary bg-primary/10" : "border-border"}`}>
            <BookOpen className="w-4 h-4" /> {t("auth.lecturer")}
          </button>
          <button type="button" onClick={() => setRole("student")} className={`flex flex-col items-center gap-1 border rounded-lg py-3 text-xs ${role === "student" ? "border-primary bg-primary/10" : "border-border"}`}>
            <GraduationCap className="w-4 h-4" /> {t("auth.student")}
          </button>
        </div>

        <form onSubmit={submit} className="space-y-2.5">
          <input required placeholder={t("auth.fullName")} value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <input type="email" required placeholder={t("auth.email")} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="password" required minLength={6} autoComplete="new-password" placeholder={t("auth.password")} value={pw} onChange={e => setPw(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2.5 text-base sm:text-sm" />
            <input type="password" required minLength={6} autoComplete="new-password" placeholder={t("auth.confirmPassword")} value={pw2} onChange={e => setPw2(e.target.value)} className={`bg-background border rounded-md px-3 py-2.5 text-base sm:text-sm ${pw2 && pw !== pw2 ? "border-destructive" : "border-border"}`} />
          </div>
          {pw2 && pw !== pw2 && <p className="text-[11px] text-destructive">{t("auth.passwordsDontMatch")}</p>}

          {role === "lecturer" && (
            <>
              <input required placeholder={t("auth.institution")} value={institution} onChange={e => setInstitution(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input required placeholder={t("auth.department")} value={department} onChange={e => setDepartment(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
                <input placeholder={t("auth.phone")} value={phone} onChange={e => setPhone(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </div>
            </>
          )}

          {role === "student" && (
            <>
              <input required placeholder={t("auth.studentId")} value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <input required placeholder={t("auth.sessionCode")} value={code} onChange={e => setCode(e.target.value.toUpperCase())} className={`w-full bg-background border rounded-md px-3 py-2 text-sm uppercase tracking-widest ${codeCheck.state === "invalid" ? "border-destructive" : codeCheck.state === "valid" ? "border-primary" : "border-border"}`} />
              {codeCheck.state === "checking" && <p className="text-[11px] text-muted-foreground">Checking code…</p>}
              {codeCheck.state === "valid" && <p className="text-[11px] text-primary">✓ Matched {codeCheck.className ? `"${codeCheck.className}"` : "class"}{codeCheck.lecturer ? ` — ${codeCheck.lecturer}` : ""}</p>}
              {codeCheck.state === "invalid" && <p className="text-[11px] text-destructive">This code doesn't match any lecturer. Ask your lecturer for the correct class code.</p>}
            </>
          )}

          <button disabled={busy || (pw !== pw2) || (role === "student" && codeCheck.state !== "valid")} className="w-full min-h-11 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium disabled:opacity-50">{busy ? t("common.saving") : t("auth.continueAs", { role: role === "lecturer" ? t("auth.lecturer") : t("auth.student") })}</button>
        </form>

        <button onClick={google} className="w-full mt-3 border border-border rounded-md py-2 text-sm hover:bg-accent">{t("auth.google")}</button>
        {role === "lecturer" && (
          <p className="text-[11px] text-muted-foreground text-center mt-3">{t("auth.lecturerNote")}</p>
        )}
        <div className="text-xs text-center mt-4 text-muted-foreground">
          {t("auth.haveAccount")} <Link to="/login" className="text-primary">{t("auth.signInLink")}</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
