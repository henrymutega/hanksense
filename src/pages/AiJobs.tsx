import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState, useStudentJobUsage } from "@/lib/lecturer";
import { generateJobFromPrompt, type AIJob } from "@/lib/ai-jobs.functions";
import { Wand2, Loader2, ArrowRight, Check, AlertTriangle, Sparkles, Pencil } from "lucide-react";
import { toast } from "sonner";



type Klass = { id: string; name: string; course_code: string | null; lecturer_id: string };
type Sess = { id: string; title: string; class_id: string };

function AiJobsPage() {
  const { user, role } = useAuth();
  const { canWrite, isStudent } = useLecturerState();
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const genFn = useServerFn(generateJobFromPrompt);

  const suggestions = (t("aiJobsPage.suggestions", { returnObjects: true }) as string[]) || [];

  const [classes, setClasses] = useState<Klass[]>([]);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [classId, setClassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [job, setJob] = useState<AIJob | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const selectedClass = classes.find(c => c.id === classId) || null;
  // Quota is per lecturer: scope the count to the owner of the selected class.
  const usage = useStudentJobUsage(selectedClass?.lecturer_id ?? null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (isStudent) {
        // Fetch class IDs, then read the classes rows (RLS: is_class_member allows it).
        // Avoid embedded joins here because PostgREST can return either an object or
        // an array depending on relationship inference, which hid the class from the UI.
        const { data: memberships, error: mErr } = await supabase
          .from("class_memberships")
          .select("class_id")
          .eq("student_id", user.id);
        if (mErr) { console.error("[ai-jobs] memberships error", mErr); setClasses([]); return; }
        const ids = (memberships || []).map((r: any) => r.class_id).filter(Boolean);
        if (ids.length === 0) { setClasses([]); return; }
        const { data: rows, error: cErr } = await supabase
          .from("classes")
          .select("id,name,course_code,lecturer_id")
          .in("id", ids);
        if (cErr) { console.error("[ai-jobs] classes error", cErr); setClasses([]); return; }
        const list = (rows as Klass[]) || [];
        setClasses(list);
        // Auto-select the class the student joined via their lecturer's code
        if (list.length > 0) setClassId(prev => prev || list[0].id);
      } else {
        const { data } = await supabase.from("classes").select("id,name,course_code,lecturer_id").eq("lecturer_id", user.id);
        setClasses((data as Klass[]) || []);
      }
    })();
  }, [user?.id, isStudent]);

  useEffect(() => {
    if (!classId) { setSessions([]); setSessionId(""); return; }
    (async () => {
      // Students can read all sessions in their enrolled class (RLS: is_class_member).
      // Lecturers/admins read sessions they own for the class.
      const { data, error } = await supabase
        .from("sessions")
        .select("id,title,class_id,scheduled_at")
        .eq("class_id", classId)
        .order("scheduled_at", { ascending: false });
      if (error) { console.error("[ai-jobs] sessions error", error); setSessions([]); return; }
      const list = ((data as any[]) || []) as Sess[];
      setSessions(list);
      if (isStudent && list.length > 0) setSessionId(prev => prev || list[0].id);
    })();
  }, [classId, isStudent, user?.id]);

  if (role !== "lecturer" && role !== "admin" && role !== "student") {
    return <div className="text-sm text-muted-foreground">Access denied.</div>;
  }

  const quotaReached = isStudent && usage.remaining <= 0;

  async function generate() {
    if (!prompt.trim()) return toast.error("Describe the role you need");
    setLoading(true);
    try {
      const j = await genFn({ data: { prompt, language: i18n.language } });
      setJob(j);
      setEditing(true);
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setLoading(false); }
  }

  async function post() {
    if (!job || !sessionId || !classId || !user) return;
    setPosting(true);
    const { error } = await supabase.from("session_jobs" as any).insert({
      session_id: sessionId, class_id: classId,
      // lecturer_id is auto-set by DB trigger from the class owner; created_by is auth.uid()
      lecturer_id: isStudent ? "00000000-0000-0000-0000-000000000000" : user.id,
      created_by: user.id,
      title: job.title, department: job.department, employment_type: job.employmentType,
      location: job.location, work_mode: job.workMode, seniority: job.seniority, openings: job.openings,
      summary: job.summary, responsibilities: job.responsibilities,
      required_skills: job.requiredSkills, preferred_skills: job.preferredSkills,
      education: job.education, experience: job.experienceYears,
      salary_min: job.salaryMin || null, salary_max: job.salaryMax || null, salary_currency: job.salaryCurrency,
      benefits: job.benefits, interview_stages: job.interviewStages,
      bias_notes: job.biasFlags, status: "posted",
    }).select("id").single();
    setPosting(false);
    if (error) return toast.error(error.message);
    toast.success("Job posted to session");
    nav({ to: "/jobs" });
  }

  const stepReady = !!classId && !!sessionId;
  const f = (k: string) => t(`aiJobsPage.fields.${k}`);
  const setJ = <K extends keyof AIJob>(k: K, v: AIJob[K]) => setJob(p => p ? { ...p, [k]: v } : p);

  return (
    <div>
      <PageHeader title={t("aiJobsPage.title")} subtitle={t("aiJobsPage.subtitle")} />
      {!canWrite && !isStudent && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm rounded-md p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Subscription inactive — job posting disabled.
        </div>
      )}
      {isStudent && (
        <div className={`text-sm rounded-md p-3 mb-4 flex items-center gap-2 border ${quotaReached ? "bg-destructive/10 border-destructive/40 text-destructive" : "bg-primary/5 border-primary/30 text-primary"}`}>
          <Sparkles className="w-4 h-4" />
          {quotaReached
            ? "You've reached the 3-post limit under your lecturer. Ask your lecturer to remove an existing post to create a new one."
            : `Student mode — ${usage.remaining} of ${usage.limit} job posts remaining.`}
        </div>
      )}


      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <Step n={1} title={isStudent ? "Your Class" : "Select Class"} done={!!classId}>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
            <option value="">{classes.length === 0 && isStudent ? "— No enrolled classes —" : "— Pick a class —"}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.course_code ? `${c.course_code} · ${c.name}` : c.name}</option>)}
          </select>
          {isStudent && classes.length === 0 && (
            <div className="text-[11px] text-muted-foreground mt-1.5">Join a class using the code from your lecturer to get started.</div>
          )}
        </Step>
        <Step n={2} title="Select Session" done={!!sessionId}>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} disabled={!classId} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm disabled:opacity-50">
            <option value="">{classId && sessions.length === 0 ? (isStudent ? "— No sessions joined —" : "— No sessions —") : "— Pick a session —"}</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          {isStudent && classId && sessions.length === 0 && (
            <div className="text-[11px] text-muted-foreground mt-1.5">Join a session with the code your lecturer shared.</div>
          )}
        </Step>
        <Step n={3} title="Generate with AI" done={!!job}>
          <div className="text-xs text-muted-foreground">Describe the role below, then review and post.</div>
        </Step>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <label className="text-sm font-medium block mb-2">{t("aiJobsPage.describeLabel")}</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
          placeholder={t("aiJobsPage.describePlaceholder")}
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />

        {suggestions.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <Sparkles className="w-3 h-3" /> {t("aiJobsPage.suggestionsLabel")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button key={i} type="button" onClick={() => setPrompt(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-left">
                  {s}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5">{t("aiJobsPage.suggestionsHint")}</div>
          </div>
        )}

        <div className="flex justify-end mt-3">
          <button onClick={generate} disabled={!stepReady || !canWrite || quotaReached || loading || !prompt.trim()}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {job ? t("aiJobsPage.regenerate") : t("aiJobsPage.generate")}
          </button>
        </div>
      </div>

      {job && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {editing ? (
                <input value={job.title} onChange={e => setJ("title", e.target.value)}
                  className="text-xl font-semibold w-full bg-background border border-border rounded-md px-2 py-1" />
              ) : (
                <h2 className="text-xl font-semibold">{job.title}</h2>
              )}
              <div className="text-xs text-muted-foreground mt-1">{job.department} · {job.employmentType} · {job.workMode} · {job.location}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(v => !v)} className="border border-border rounded-md px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted">
                {editing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                {editing ? t("aiJobsPage.doneEditing") : t("aiJobsPage.edit")}
              </button>
              <button onClick={post} disabled={!canWrite || quotaReached || posting} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} {t("aiJobsPage.post")}
              </button>
            </div>
          </div>

          {editing ? (
            <>
              <div className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-md p-2">{t("aiJobsPage.editHint")}</div>
              <div className="grid md:grid-cols-3 gap-3">
                <Field label={f("department")}><input className={inp} value={job.department} onChange={e => setJ("department", e.target.value)} /></Field>
                <Field label={f("location")}><input className={inp} value={job.location} onChange={e => setJ("location", e.target.value)} /></Field>
                <Field label={f("employmentType")}>
                  <select className={inp} value={job.employmentType} onChange={e => setJ("employmentType", e.target.value)}>
                    {["Full-time","Part-time","Contract","Internship"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label={f("workMode")}>
                  <select className={inp} value={job.workMode} onChange={e => setJ("workMode", e.target.value)}>
                    {["Remote","Hybrid","Onsite"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label={f("seniority")}>
                  <select className={inp} value={job.seniority} onChange={e => setJ("seniority", e.target.value)}>
                    {["Junior","Mid","Senior","Lead"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label={f("openings")}><input type="number" min={1} className={inp} value={job.openings} onChange={e => setJ("openings", Number(e.target.value) || 1)} /></Field>
                <Field label={f("education")}><input className={inp} value={job.education} onChange={e => setJ("education", e.target.value)} /></Field>
                <Field label={f("experienceYears")}><input className={inp} value={job.experienceYears} onChange={e => setJ("experienceYears", e.target.value)} /></Field>
                <Field label={f("salaryCurrency")}><input className={inp} value={job.salaryCurrency} onChange={e => setJ("salaryCurrency", e.target.value)} /></Field>
                <Field label={f("salaryMin")}><input type="number" className={inp} value={job.salaryMin} onChange={e => setJ("salaryMin", Number(e.target.value) || 0)} /></Field>
                <Field label={f("salaryMax")}><input type="number" className={inp} value={job.salaryMax} onChange={e => setJ("salaryMax", Number(e.target.value) || 0)} /></Field>
              </div>
              <Field label={f("summary")}>
                <textarea rows={4} className={inp} value={job.summary} onChange={e => setJ("summary", e.target.value)} />
              </Field>
              <ListField label={f("responsibilities")} value={job.responsibilities} onChange={v => setJ("responsibilities", v)} sep="line" />
              <div className="grid md:grid-cols-2 gap-3">
                <ListField label={f("requiredSkills")} value={job.requiredSkills} onChange={v => setJ("requiredSkills", v)} sep="comma" />
                <ListField label={f("preferredSkills")} value={job.preferredSkills} onChange={v => setJ("preferredSkills", v)} sep="comma" />
              </div>
              <ListField label={f("benefits")} value={job.benefits} onChange={v => setJ("benefits", v)} sep="line" />
              <ListField label={f("interviewStages")} value={job.interviewStages} onChange={v => setJ("interviewStages", v)} sep="line" />
            </>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{job.summary}</p>
              <Section title={f("responsibilities")} items={job.responsibilities} />
              <div className="grid md:grid-cols-2 gap-4">
                <Section title={f("requiredSkills")} items={job.requiredSkills} tone="primary" />
                <Section title={f("preferredSkills")} items={job.preferredSkills} />
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <Kv k={f("education")} v={job.education} />
                <Kv k={f("experienceYears")} v={job.experienceYears} />
                <Kv k="Salary" v={`${job.salaryCurrency} ${job.salaryMin?.toLocaleString()} – ${job.salaryMax?.toLocaleString()}`} />
              </div>
              <Section title={f("benefits")} items={job.benefits} />
              <Section title={f("interviewStages")} items={job.interviewStages} numbered />
            </>
          )}

          {job.biasFlags?.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
              <div className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Bias detection</div>
              <ul className="text-xs space-y-1">
                {job.biasFlags.map((b, i) => (
                  <li key={i}><strong>{b.term}</strong> → <em>{b.suggest}</em> — {b.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inp = "w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}

function ListField({ label, value, onChange, sep }: { label: string; value: string[]; onChange: (v: string[]) => void; sep: "line" | "comma" }) {
  const joined = sep === "line" ? (value || []).join("\n") : (value || []).join(", ");
  return (
    <Field label={label}>
      <textarea rows={sep === "line" ? Math.max(3, (value?.length || 0)) : 2} className={inp} value={joined}
        onChange={e => {
          const raw = e.target.value;
          const parts = sep === "line"
            ? raw.split("\n").map(s => s.trim()).filter(Boolean)
            : raw.split(",").map(s => s.trim()).filter(Boolean);
          onChange(parts);
        }} />
    </Field>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className={`bg-card border rounded-xl p-3 ${done ? "border-primary" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-full grid place-items-center text-xs font-semibold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {done ? <Check className="w-3 h-3" /> : n}
        </div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      {children}
    </div>
  );
}
function Section({ title, items, tone, numbered }: { title: string; items: string[]; tone?: "primary"; numbered?: boolean }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      {numbered ? (
        <ol className="text-sm list-decimal pl-5 space-y-0.5">{items.map((x, i) => <li key={i}>{x}</li>)}</ol>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((x, i) => <span key={i} className={`text-xs px-2 py-1 rounded ${tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-foreground"}`}>{x}</span>)}
        </div>
      )}
    </div>
  );
}
function Kv({ k, v }: { k: string; v: string | null }) {
  return <div><div className="text-[10px] uppercase text-muted-foreground tracking-wider">{k}</div><div>{v || "—"}</div></div>;
}

export default AiJobsPage;
