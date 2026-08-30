import { useTranslation } from "react-i18next";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import { DEMO_CANDIDATES, DMM_JOB, STAGE_LABEL, type SessionCandidate, type SessionJob, type Stage } from "@/lib/session-jobs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Sparkles, Tv, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Route = getRouteApi("/sessions_/$id");



type Sess = { id: string; title: string; class_id: string; scheduled_at: string | null; status: string };

function SessionDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const { canWrite } = useLecturerState();
  const isLecturer = role === "lecturer" || role === "admin";
  const [sess, setSess] = useState<Sess | null>(null);
  const [klass, setKlass] = useState<{ name: string; course_code: string | null } | null>(null);
  const [jobs, setJobs] = useState<SessionJob[]>([]);
  const [cands, setCands] = useState<SessionCandidate[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);

  async function load() {
    const { data: s } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
    if (!s) return;
    setSess(s as Sess);
    const { data: k } = await supabase.from("classes").select("name, course_code").eq("id", (s as any).class_id).maybeSingle();
    setKlass(k as any);
    const { data: j } = await supabase.from("session_jobs" as any).select("*").eq("session_id", id);
    setJobs((j as any) || []);
    const { data: c } = await supabase.from("session_candidates" as any).select("*").eq("session_id", id);
    setCands((c as any) || []);
    if (isLecturer) {
      const { data: m } = await supabase
        .from("class_memberships")
        .select("student_id, profiles:profiles!inner(id, full_name, email)")
        .eq("class_id", (s as any).class_id);
      const list = ((m as any[]) || []).map(r => r.profiles).filter(Boolean);
      setStudents(list);
    }
  }
  useEffect(() => { load(); }, [id, isLecturer]);

  async function seedDemo() {
    if (!sess || !user) return;
    const { data: j, error } = await supabase.from("session_jobs" as any).insert({
      session_id: sess.id, class_id: sess.class_id, lecturer_id: user.id, created_by: user.id,
      ...DMM_JOB, status: "posted",
    }).select("id").single();
    if (error) return toast.error(error.message);
    const jobId = (j as any).id;
    const rows = DEMO_CANDIDATES.map(d => ({
      job_id: jobId, session_id: sess.id, class_id: sess.class_id,
      name: d.name, skills: d.skills, experience_years: d.experience,
      score: d.score, recommendation: d.rec, ai_explanation: d.rec,
      matching_skills: d.skills, missing_skills: d.missing,
      cv_summary: `${d.name} — ${d.experience} years in digital marketing.`,
      stage: d.score >= 90 ? "interview" : d.score >= 85 ? "shortlisted" : "ai_screened" as Stage,
    }));
    await supabase.from("session_candidates" as any).insert(rows);
    toast.success(t("sessionDetail.seeded"));
    load();
  }

  if (!sess) return <div className="text-sm text-muted-foreground">{t("common.loading")}</div>;

  const stages: Stage[] = ["applied", "ai_screened", "assessment", "shortlisted", "interview", "offer", "hired"];
  const funnel = stages.map(s => ({ name: STAGE_LABEL[s], value: cands.filter(c => c.stage === s).length }));
  const skillCounts: Record<string, number> = {};
  cands.forEach(c => c.skills.forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  const bands = [{ name: "90+", value: cands.filter(c => c.score >= 90).length }, { name: "80-89", value: cands.filter(c => c.score >= 80 && c.score < 90).length }, { name: "70-79", value: cands.filter(c => c.score >= 70 && c.score < 80).length }, { name: "<70", value: cands.filter(c => c.score < 70).length }];
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#94a3b8"];

  return (
    <div>
      <Link to="/sessions" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"><ArrowLeft className="w-3 h-3" /> {t("sessions.title")}</Link>
      <PageHeader title={sess.title} subtitle={`${klass?.course_code || ""} ${klass?.name || ""} · ${sess.status}`} actions={
        <div className="flex gap-2">
          {isLecturer && canWrite && jobs.length === 0 && (
            <button onClick={seedDemo} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t("sessionDetail.seedDemo")}</button>
          )}
          <Link to="/present/$sessionId" params={{ sessionId: sess.id }} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded flex items-center gap-1"><Tv className="w-3 h-3" /> {t("sessionDetail.launchPresenter")}</Link>
        </div>
      } />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label={t("stages.Applied")} value={cands.length} />
        <Stat label={t("stages.Screened")} value={cands.filter(c => ["ai_screened", "assessment", "shortlisted", "interview", "offer", "hired"].includes(c.stage)).length} />
        <Stat label={t("stages.Shortlisted")} value={cands.filter(c => ["shortlisted", "interview", "offer", "hired"].includes(c.stage)).length} />
        <Stat label={t("stages.Interview")} value={cands.filter(c => ["interview", "offer", "hired"].includes(c.stage)).length} />
        <Stat label={t("stages.Hired")} value={cands.filter(c => c.stage === "hired").length} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Panel title={t("dashboard.hiringFunnel")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnel}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={t("candidates.score")}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={bands} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>{bands.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={t("candidates.skills")}>
        {topSkills.length === 0 ? <div className="text-sm text-muted-foreground">{t("dashboard.noCandidates")}</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSkills} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} /><YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">{t("sessionDetail.jobs")} ({jobs.length})</h2>
        {jobs.length === 0 ? <div className="text-sm text-muted-foreground">{t("sessionDetail.noJobs")} <Link to="/ai-jobs" className="text-primary hover:underline">{t("jobs.createFirst")}</Link></div> : (
          <div className="grid md:grid-cols-2 gap-3">
            {jobs.map(j => {
              const jc = cands.filter(c => c.job_id === j.id);
              return (
                <Link key={j.id} to="/pipeline" search={{ job: j.id } as any} className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
                  <div className="font-semibold">{j.title}</div>
                  <div className="text-xs text-muted-foreground">{j.department} · {jc.length} candidates · top score {Math.round(Math.max(0, ...jc.map(c => c.score)))}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {isLecturer && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Students in this class ({students.length})</h2>
          {students.length === 0 ? (
            <div className="text-sm text-muted-foreground">No students have joined yet. Share the session join code.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Student</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Posts in session</th>
                    <th className="text-left px-3 py-2">Candidates screened</th>
                    <th className="text-left px-3 py-2">Quota</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(st => {
                    const myJobs = jobs.filter(j => (j as any).created_by === st.id);
                    const myCands = cands.filter(c => myJobs.some(j => j.id === c.job_id));
                    return (
                      <tr key={st.id} className="border-t border-border">
                        <td className="px-3 py-2">{st.full_name || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{st.email}</td>
                        <td className="px-3 py-2">{myJobs.length}</td>
                        <td className="px-3 py-2">{myCands.length}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${myJobs.length >= 3 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                            {myJobs.length}/3
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="bg-card border border-border rounded-xl p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-2xl font-semibold">{value}</div></div>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-card border border-border rounded-xl p-4"><div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div>{children}</div>;
}

export default SessionDetailPage;
