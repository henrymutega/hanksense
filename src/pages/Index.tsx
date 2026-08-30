import { Link } from "@tanstack/react-router";
import { PageHeader, Stat } from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowRight, Brain, Users, Briefcase, TrendingUp, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Landing } from "@/components/Landing";
import { supabase } from "@/integrations/supabase/client";
import { STUDENT_JOB_LIMIT } from "@/lib/lecturer";
import { LogoLoader } from "@/components/LogoLoader";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <LogoLoader />;
  if (!user) return <Landing />;
  return <Dashboard />;
}

type JobRow = { id: string; title: string; status: string; created_by: string; session_id: string; class_id: string; created_at: string };
type CandRow = { id: string; job_id: string; stage: string; score: number };

const STAGES = ["applied", "ai_screened", "assessment", "shortlisted", "interview", "offer", "hired", "talent_pool"] as const;

function Dashboard() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const isStudent = role === "student";

  const [busy, setBusy] = useState(true);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [students, setStudents] = useState(0);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [cands, setCands] = useState<CandRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      // classes visible to this user (owned by lecturer / joined by student)
      const { data: cls } = await supabase.from("classes").select("id, name").order("created_at", { ascending: false });
      const classIds = (cls ?? []).map(c => c.id);

      const [{ count: sCount }, { count: mCount }, { data: jobRows }] = await Promise.all([
        classIds.length
          ? supabase.from("sessions").select("id", { count: "exact", head: true }).in("class_id", classIds)
          : Promise.resolve({ count: 0 } as any),
        classIds.length
          ? supabase.from("class_memberships").select("id", { count: "exact", head: true }).in("class_id", classIds)
          : Promise.resolve({ count: 0 } as any),
        supabase.from("session_jobs").select("id, title, status, created_by, session_id, class_id, created_at").order("created_at", { ascending: false }),
      ]);

      const allJobs = (jobRows ?? []) as JobRow[];
      const scopedJobs = isStudent ? allJobs.filter(j => j.created_by === user.id) : allJobs;
      const jobIds = scopedJobs.map(j => j.id);

      const { data: candRows } = jobIds.length
        ? await supabase.from("session_candidates").select("id, job_id, stage, score").in("job_id", jobIds)
        : { data: [] as any };

      if (cancelled) return;
      setClasses(cls ?? []);
      setSessionCount(sCount ?? 0);
      setStudents(mCount ?? 0);
      setJobs(scopedJobs);
      setCands((candRows ?? []) as CandRow[]);
      setBusy(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, role]);

  const byStage = useMemo(() => {
    const m = new Map<string, number>();
    cands.forEach(c => m.set(c.stage, (m.get(c.stage) ?? 0) + 1));
    return STAGES.map(s => ({ stage: t(`stageKeys.${s}`, { defaultValue: s.replace(/_/g, " ") }), value: m.get(s) ?? 0 }));
  }, [cands, t]);

  const counts = useMemo(() => ({
    total: cands.length,
    interview: cands.filter(c => c.stage === "interview").length,
    offer: cands.filter(c => c.stage === "offer").length,
    hired: cands.filter(c => c.stage === "hired").length,
    avg: cands.length ? Math.round(cands.reduce((s, c) => s + Number(c.score || 0), 0) / cands.length) : 0,
  }), [cands]);

  const quotaLeft = Math.max(0, STUDENT_JOB_LIMIT - jobs.length);

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Link to="/ai-jobs" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
        <Sparkles className="w-4 h-4" /> {t("dashboard.newJob")}
      </Link>
      <Link to="/simulation" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        <Brain className="w-4 h-4" /> {t("dashboard.lectureMode")}
      </Link>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={isStudent ? t("dashboard.studentSubtitle") : t("dashboard.lecturerSubtitle")}
        actions={actions}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {isStudent ? (
          <>
            <Stat label={t("dashboard.myJobs")} value={jobs.length} hint={t("dashboard.quotaLeft", { n: quotaLeft, total: STUDENT_JOB_LIMIT })} />
            <Stat label={t("dashboard.candidatesCount")} value={counts.total} hint={t("dashboard.avgScore", { n: counts.avg })} />
            <Stat label={t("dashboard.interviewsStage")} value={counts.interview} />
            <Stat label={t("dashboard.offersOut")} value={`${counts.offer} / ${counts.hired}`} tone="success" hint={t("dashboard.hiredCount")} />
          </>
        ) : (
          <>
            <Stat label={t("dashboard.myClasses")} value={classes.length} hint={t("dashboard.sessionsCount") + `: ${sessionCount}`} />
            <Stat label={t("dashboard.studentsJoined")} value={students} />
            <Stat label={t("dashboard.jobsPosted")} value={jobs.length} hint={t("dashboard.candidatesCount") + `: ${counts.total}`} />
            <Stat label={t("dashboard.offersOut")} value={`${counts.offer} / ${counts.hired}`} tone="success" hint={t("dashboard.avgScore", { n: counts.avg })} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:col-span-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold">{t("dashboard.stageBreakdown")}</h2>
            <span className="text-xs text-muted-foreground">{counts.total} {t("common.candidates")}</span>
          </div>
          {busy ? (
            <p className="text-sm text-muted-foreground py-12 text-center">…</p>
          ) : counts.total === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">{t("dashboard.noCandidates")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byStage} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis type="category" dataKey="stage" stroke="var(--muted-foreground)" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6 min-w-0">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{t("dashboard.recentJobs")}</h2>
              <Link to="/jobs" className="text-xs text-primary hover:underline">{t("dashboard.viewAll")}</Link>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t("dashboard.noJobsYet")}</p>
            ) : (
              <ul className="space-y-2">
                {jobs.slice(0, 5).map(j => (
                  <li key={j.id}>
                    <Link to="/pipeline" search={{ job: j.id }} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors">
                      <span className="text-sm font-medium truncate">{j.title}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{j.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <h2 className="font-semibold mb-3">{t("common.quickActions")}</h2>
            <div className="space-y-2">
              {[
                { to: "/ai-jobs", icon: Sparkles, label: t("dashboard.createJobAI") },
                { to: "/screening", icon: Briefcase, label: t("dashboard.uploadCVs") },
                { to: "/pipeline", icon: TrendingUp, label: t("dashboard.managePipeline") },
                { to: "/candidates", icon: Users, label: t("dashboard.browseCandidates") },
              ].map(a => (
                <Link key={a.to} to={a.to} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors group">
                  <span className="flex items-center gap-3 text-sm font-medium min-w-0"><a.icon className="w-4 h-4 text-primary shrink-0" /><span className="truncate">{a.label}</span></span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
