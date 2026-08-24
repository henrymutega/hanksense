import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { STAGE_LABEL, type SessionCandidate, type SessionJob } from "@/lib/session-jobs";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";



export function ScoreBadge({ score }: { score: number }) {
  const s = Math.round(score);
  const color = s >= 90 ? "bg-emerald-500/15 text-emerald-600" : s >= 75 ? "bg-primary/15 text-primary" : s >= 60 ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground";
  return <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${color}`}>{s}</span>;
}

export function StageBadge({ stage }: { stage: string }) {
  return <span className="text-xs bg-muted text-foreground px-2 py-0.5 rounded">{stage}</span>;
}

type Row = SessionCandidate & { _job?: string; _jobCreatedBy?: string; _jobLecturerId?: string };
type Scope = "all" | "mine" | "lecturer" | "students" | string;

function CandidatesPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const isLecturer = role === "lecturer" || role === "admin";
  const isStudent = role === "student";
  const [rows, setRows] = useState<Row[]>([]);
  const [jobs, setJobs] = useState<(SessionJob & { _authorName?: string; _authorIsLecturer?: boolean })[]>([]);
  const [jobFilter, setJobFilter] = useState("");
  const [scope, setScope] = useState<Scope>(isStudent ? "mine" : "all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: c }, { data: j }] = await Promise.all([
        supabase.from("session_candidates" as any).select("*, session_jobs(title, created_by, classes(lecturer_id))").order("score", { ascending: false }),
        supabase.from("session_jobs" as any).select("*, classes(lecturer_id)"),
      ]);
      const jl = (j as any[]) || [];
      const authorIds = Array.from(new Set(jl.map((x: any) => x.created_by).filter(Boolean)));
      let authors: Record<string, { full_name?: string; email?: string }> = {};
      if (authorIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", authorIds);
        (profs || []).forEach((p: any) => { authors[p.id] = p; });
      }
      setJobs(jl.map((x: any) => ({
        ...x,
        _authorName: authors[x.created_by]?.full_name || authors[x.created_by]?.email || "Unknown",
        _authorIsLecturer: !!x.classes && x.created_by === x.classes.lecturer_id,
      })));
      setRows(((c as any[]) || []).map(x => ({
        ...x,
        _job: x.session_jobs?.title || "—",
        _jobCreatedBy: x.session_jobs?.created_by,
        _jobLecturerId: x.session_jobs?.classes?.lecturer_id,
      })));
    })();
  }, [user?.id]);

  const studentAuthors = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach(x => {
      if (!x._authorIsLecturer && (x as any).created_by) map.set((x as any).created_by, x._authorName || "Student");
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [jobs]);

  const visible = useMemo(() => {
    let base = rows;
    if (isStudent) {
      // Students can only see candidates for jobs they created
      base = rows.filter(r => r._jobCreatedBy === user?.id);
    } else {
      if (scope === "mine") base = rows.filter(r => r._jobCreatedBy === user?.id);
      else if (scope === "lecturer") base = rows.filter(r => r._jobCreatedBy && r._jobCreatedBy === r._jobLecturerId);
      else if (scope === "students") base = rows.filter(r => r._jobCreatedBy && r._jobCreatedBy !== r._jobLecturerId);
      else if (scope !== "all") base = rows.filter(r => r._jobCreatedBy === scope);
    }
    return jobFilter ? base.filter(r => r.job_id === jobFilter) : base;
  }, [rows, jobFilter, scope, isStudent, user?.id]);

  const visibleJobs = useMemo(() => {
    if (isStudent) return jobs.filter(j => (j as any).created_by === user?.id);
    return jobs;
  }, [jobs, isStudent, user?.id]);

  return (
    <div>
      <PageHeader title={t("candidates.title")} subtitle={t("candidates.subtitle")} actions={
        <div className="flex gap-2 flex-wrap">
          {!isStudent && (
            <select value={scope} onChange={e => setScope(e.target.value)} className="bg-background border border-border rounded-md px-3 py-1.5 text-sm">
              <option value="all">All candidates</option>
              <option value="mine">My postings</option>
              <option value="lecturer">Lecturer-posted</option>
              <option value="students">All student-posted</option>
              {studentAuthors.length > 0 && <optgroup label="By student">
                {studentAuthors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>}
            </select>
          )}
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="bg-background border border-border rounded-md px-3 py-1.5 text-sm">
            <option value="">{t("candidates.allJobs")}</option>
            {visibleJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
      } />

      {visible.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {t("candidates.empty")} <Link to="/screening" search={{ job: "" }} className="text-primary hover:underline">{t("candidates.aiScreening")}</Link>.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left px-4 py-2">{t("candidates.rank")}</th><th className="text-left">{t("candidates.name")}</th><th className="text-left">{t("candidates.job")}</th><th className="text-left">{t("candidates.stage")}</th><th className="text-left">{t("candidates.skills")}</th><th className="text-right px-4">{t("candidates.score")}</th></tr>
            </thead>
            <tbody>
              {visible.map((c, i) => (
                <tr key={c.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-4 py-2 text-muted-foreground font-mono">{i + 1}</td>
                  <td><Link to="/candidates/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.name}</Link></td>
                  <td className="text-muted-foreground">{c._job}</td>
                  <td className="text-xs"><span className="bg-muted px-2 py-0.5 rounded">{t(`stages.${STAGE_LABEL[c.stage]}` as any, { defaultValue: STAGE_LABEL[c.stage] })}</span></td>
                  <td className="text-xs text-muted-foreground">{c.skills.slice(0, 4).join(", ")}{c.skills.length > 4 ? "…" : ""}</td>
                  <td className="px-4 text-right"><ScoreBadge score={c.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CandidatesPage;
