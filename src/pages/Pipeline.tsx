import { Link, getRouteApi } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import { STAGES, STAGE_LABEL, type Stage, type SessionCandidate, type SessionJob } from "@/lib/session-jobs";
import { toast } from "sonner";
import { updateCandidateStage } from "@/lib/pipeline-flow";
import { useTranslation } from "react-i18next";

const Route = getRouteApi("/pipeline");



type JobRow = SessionJob & { _authorName?: string; _authorIsLecturer?: boolean };
type Scope = "all" | "mine" | "lecturer" | "students" | string;

function PipelinePage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const { canWrite } = useLecturerState();
  const isLecturer = role === "lecturer" || role === "admin";
  const isStudent = role === "student";
  const { job: jobFromUrl } = Route.useSearch();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [jobId, setJobId] = useState(jobFromUrl);
  const [cands, setCands] = useState<SessionCandidate[]>([]);
  const [scope, setScope] = useState<Scope>(isStudent ? "mine" : "all");

  async function loadJobs() {
    const { data } = await supabase
      .from("session_jobs" as any)
      .select("*, classes(lecturer_id)")
      .order("created_at", { ascending: false });
    const list = (data as any[]) || [];
    const authorIds = Array.from(new Set(list.map(j => j.created_by).filter(Boolean)));
    let authors: Record<string, { full_name?: string; email?: string }> = {};
    if (authorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", authorIds);
      (profs || []).forEach((p: any) => { authors[p.id] = p; });
    }
    const mapped: JobRow[] = list.map((j: any) => ({
      ...j,
      _authorName: authors[j.created_by]?.full_name || authors[j.created_by]?.email || "Unknown",
      _authorIsLecturer: !!j.classes && j.created_by === j.classes.lecturer_id,
    }));
    setJobs(mapped);
    if (!jobId && mapped?.length) setJobId(mapped[0].id);
  }
  async function loadCands() {
    if (!jobId) return setCands([]);
    const { data } = await supabase.from("session_candidates" as any).select("*").eq("job_id", jobId).order("score", { ascending: false });
    setCands(((data as any) as SessionCandidate[]) || []);
  }
  useEffect(() => { loadJobs(); }, [user?.id]);
  useEffect(() => { loadCands(); }, [jobId]);

  const studentAuthors = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach(x => {
      if (!x._authorIsLecturer && (x as any).created_by) map.set((x as any).created_by, x._authorName || "Student");
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    if (isStudent) {
      const base = jobs.filter(j => (j as any).created_by === user?.id || j._authorIsLecturer);
      if (scope === "mine") return base.filter(j => (j as any).created_by === user?.id);
      if (scope === "lecturer") return base.filter(j => j._authorIsLecturer);
      return base;
    }
    if (scope === "mine") return jobs.filter(j => (j as any).created_by === user?.id);
    if (scope === "lecturer") return jobs.filter(j => j._authorIsLecturer);
    if (scope === "students") return jobs.filter(j => !j._authorIsLecturer);
    if (scope !== "all") return jobs.filter(j => (j as any).created_by === scope);
    return jobs;
  }, [jobs, scope, isStudent, user?.id]);


  const stageLabel = (s: Stage) => t(`stages.${STAGE_LABEL[s]}` as any, { defaultValue: STAGE_LABEL[s] });
  const currentJob = jobs.find(j => j.id === jobId);
  const ownsJob = !!user && (currentJob as any)?.created_by === user.id;
  const canEdit = canWrite && (isLecturer || ownsJob);

  async function move(id: string, stage: Stage) {
    if (!canWrite) return;
    await updateCandidateStage(id, stage);
    if (stage === "hired") toast.success(t("pipeline.hiredToast"));
    else toast.success(t("pipeline.movedTo", { stage: stageLabel(stage) }));
    loadCands();
  }

  return (
    <div>
      <PageHeader title={t("pipeline.title")} subtitle={t("pipeline.subtitle")} />

      <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
        <label className="text-xs text-muted-foreground">Show:</label>
        <select value={scope} onChange={e => setScope(e.target.value)} className="bg-background border border-border rounded-md px-3 py-1.5 text-sm">
          {isStudent ? (
            <>
              <option value="mine">My postings</option>
              <option value="lecturer">From my lecturer</option>
              <option value="all">All I can see</option>
            </>
          ) : (
            <>
              <option value="all">All jobs</option>
              <option value="mine">My postings</option>
              <option value="lecturer">Lecturer-posted</option>
              <option value="students">All student-posted</option>
              {studentAuthors.length > 0 && <optgroup label="By student">
                {studentAuthors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>}
            </>
          )}
        </select>
        <label className="text-xs text-muted-foreground">{t("pipeline.job")}</label>
        <select value={jobId} onChange={e => setJobId(e.target.value)} className="bg-background border border-border rounded-md px-3 py-1.5 text-sm">
          <option value="">{t("pipeline.pick")}</option>
          {visibleJobs.map(j => <option key={j.id} value={j.id}>{j.title}{j._authorName ? ` — ${j._authorName}` : ""}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{t("pipeline.countCandidates", { n: cands.length })}</span>
      </div>


      <div className="grid gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(180px, 1fr))` }}>
        {STAGES.map(stage => {
          const items = cands.filter(c => c.stage === stage);
          return (
            <div key={stage} className="bg-card border border-border rounded-xl p-2 min-h-[400px]">
              <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1.5 flex items-center justify-between">
                <span>{stageLabel(stage)}</span>
                <span className="bg-muted text-foreground rounded-full px-1.5 text-[10px]">{items.length}</span>
              </div>
              <div className="space-y-1.5">
                {items.map(c => (
                  <div key={c.id} className="bg-background border border-border rounded-md p-2 text-xs">
                    <div className="flex justify-between items-start gap-1">
                      <Link to="/candidates/$id" params={{ id: c.id }} className="font-medium hover:underline truncate">{c.name}</Link>
                      <span className="font-mono font-semibold text-primary">{Math.round(c.score)}</span>
                    </div>
                    {c.recommendation && <div className="text-muted-foreground text-[10px] mt-0.5 line-clamp-2">{c.recommendation}</div>}
                    {canEdit && (
                      <select value={stage} onChange={e => move(c.id, e.target.value as Stage)} className="w-full mt-1.5 bg-card border border-border rounded text-[10px] py-0.5">
                        {STAGES.concat("talent_pool" as Stage, "rejected" as Stage).map(s => <option key={s} value={s}>{stageLabel(s)}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PipelinePage;
