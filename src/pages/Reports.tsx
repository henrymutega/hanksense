import { PageHeader, Stat } from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Job = { id: string; title: string; created_at: string };
type Cand = {
  id: string;
  job_id: string;
  stage: string;
  score: number | null;
  skills: string[] | null;
  created_at: string;
};

const STAGES = ["applied", "ai_screened", "assessment", "shortlisted", "interview", "offer", "hired", "rejected", "talent_pool"] as const;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cands, setCands] = useState<Cand[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let jq = supabase.from("session_jobs").select("id, title, created_at").order("created_at", { ascending: true });
      if (role === "lecturer") jq = jq.eq("lecturer_id", user.id);
      else if (role === "student") jq = jq.eq("created_by", user.id);
      const { data: jobRows } = await jq;
      const jobList = (jobRows as Job[]) || [];
      let candList: Cand[] = [];
      if (jobList.length) {
        const { data: candRows } = await supabase
          .from("session_candidates")
          .select("id, job_id, stage, score, skills, created_at")
          .in("job_id", jobList.map(j => j.id));
        candList = (candRows as Cand[]) || [];
      }
      if (cancelled) return;
      setJobs(jobList);
      setCands(candList);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, role]);

  const m = useMemo(() => {
    const byStage: Record<string, number> = {};
    STAGES.forEach(s => { byStage[s] = 0; });
    cands.forEach(c => { byStage[c.stage] = (byStage[c.stage] || 0) + 1; });
    const hired = byStage["hired"] || 0;
    const scored = cands.filter(c => (c.score ?? 0) > 0);
    const avgScore = scored.length ? Math.round(scored.reduce((s, c) => s + (c.score || 0), 0) / scored.length) : 0;

    // last 8 weeks of applications
    const weeks: { m: string; v: number }[] = [];
    const base = startOfWeek(new Date());
    for (let i = 7; i >= 0; i--) {
      const start = new Date(base); start.setDate(start.getDate() - i * 7);
      const end = new Date(start); end.setDate(end.getDate() + 7);
      const v = cands.filter(c => {
        const d = new Date(c.created_at).getTime();
        return d >= start.getTime() && d < end.getTime();
      }).length;
      weeks.push({ m: start.toLocaleDateString(i18n.language, { month: "short", day: "numeric" }), v });
    }

    const skillCount: Record<string, number> = {};
    cands.forEach(c => (c.skills || []).forEach(s => {
      const k = s.trim();
      if (k) skillCount[k] = (skillCount[k] || 0) + 1;
    }));
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, v]) => ({ name, v }));

    const perJob = jobs.map(j => {
      const list = cands.filter(c => c.job_id === j.id);
      const s = list.filter(c => (c.score ?? 0) > 0);
      return {
        id: j.id,
        title: j.title,
        candidates: list.length,
        hired: list.filter(c => c.stage === "hired").length,
        avg: s.length ? Math.round(s.reduce((a, c) => a + (c.score || 0), 0) / s.length) : 0,
      };
    }).sort((a, b) => b.candidates - a.candidates);

    const funnel = (["applied", "ai_screened", "shortlisted", "interview", "offer", "hired"] as const).map(s => ({
      m: t(`pipeline.stages.${s}` as any, { defaultValue: s.replace("_", " ") }),
      v: byStage[s] || 0,
    }));

    return {
      byStage, hired, avgScore, weeks, topSkills, perJob, funnel,
      hireRate: cands.length ? Math.round((hired / cands.length) * 100) : 0,
    };
  }, [cands, jobs, i18n.language, t]);

  const empty = !loading && jobs.length === 0 && cands.length === 0;

  return (
    <div>
      <PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")} />

      {loading ? (
        <div className="text-sm text-muted-foreground">{t("reports.loading")}</div>
      ) : empty ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">{t("reports.empty")}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label={t("reports.jobs")} value={jobs.length} />
            <Stat label={t("reports.candidates")} value={cands.length} />
            <Stat label={t("reports.hired")} value={m.hired} tone="success" hint={`${m.hireRate}% ${t("reports.hireRate").toLowerCase()}`} />
            <Stat label={t("reports.avgScore")} value={m.avgScore || "—"} />
            <Stat label={t("reports.offers")} value={m.byStage["offer"] || 0} />
            <Stat label={t("reports.interviews")} value={m.byStage["interview"] || 0} />
            <Stat label={t("reports.talentPool")} value={m.byStage["talent_pool"] || 0} />
            <Stat label={t("stages.Rejected")} value={m.byStage["rejected"] || 0} tone="warning" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">{t("reports.funnel")}</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={m.funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">{t("reports.overTime")}</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={m.weeks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {m.topSkills.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <h2 className="font-semibold mb-3">{t("reports.topSkills")}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={m.topSkills} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="v" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <h2 className="font-semibold p-5 pb-3">{t("reports.perJob")}</h2>
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">{t("reports.jobCol")}</th>
                  <th className="p-3">{t("reports.candCol")}</th>
                  <th className="p-3">{t("reports.hiredCol")}</th>
                  <th className="p-3">{t("reports.scoreCol")}</th>
                </tr>
              </thead>
              <tbody>
                {m.perJob.map(j => (
                  <tr key={j.id} className="border-t border-border">
                    <td className="p-3">{j.title}</td>
                    <td className="p-3 text-center">{j.candidates}</td>
                    <td className="p-3 text-center">{j.hired}</td>
                    <td className="p-3 text-center">{j.avg || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportsPage;
