import { Link, getRouteApi } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/PageHeader";
import { extractTextFromFile } from "@/lib/cv-parser";
import { parseCvText, matchCvToJob } from "@/lib/ai-jobs.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import type { SessionJob } from "@/lib/session-jobs";
import { Upload, Loader2, Play, ShieldCheck, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Route = getRouteApi("/screening");



type Row = { id: string; file: File; status: "queued" | "parsing" | "scoring" | "saving" | "done" | "error"; error?: string; score?: number; name?: string };

function ScreeningPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const { canWrite } = useLecturerState();
  const isLecturer = role === "lecturer" || role === "admin";
  const { job: jobIdFromUrl } = Route.useSearch();
  const parseFn = useServerFn(parseCvText);
  const matchFn = useServerFn(matchCvToJob);

  const [jobs, setJobs] = useState<SessionJob[]>([]);
  const [jobId, setJobId] = useState(jobIdFromUrl);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [ack, setAck] = useState(false);
  const drop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let q = supabase.from("session_jobs" as any).select("*").eq("status", "posted").order("created_at", { ascending: false });
      if (role === "student") q = q.eq("created_by", user.id);
      const { data } = await q;
      const list = (data as any) as SessionJob[];
      setJobs(list || []);
      if (!jobId && list?.length) setJobId(list[0].id);
    })();
  }, [user?.id, role]);

  const job = jobs.find(j => j.id === jobId);

  if (!isLecturer && role !== "student") return <div className="text-sm text-muted-foreground">{t("screening.lecturerOnly")}</div>;

  function addFiles(files: FileList | File[]) {
    if (!ack) return toast.error(t("screening.acceptDisclaimer"));
    if (!job) return toast.error(t("screening.pickJobFirst"));
    const arr = Array.from(files).slice(0, 100).filter(f => /\.(pdf|docx|txt)$/i.test(f.name));
    setRows(r => [...r, ...arr.map(f => ({ id: `${f.name}-${Math.random().toString(36).slice(2, 8)}`, file: f, status: "queued" as const }))]);
  }

  async function processOne(r: Row) {
    if (!job || !user) return;
    try {
      setRows(rs => rs.map(x => x.id === r.id ? { ...x, status: "parsing" } : x));
      const text = await extractTextFromFile(r.file);
      if (!text || text.length < 20) throw new Error(t("screening.extractFail"));
      const profile = await parseFn({ data: { cvText: text, fileName: r.file.name } });
      setRows(rs => rs.map(x => x.id === r.id ? { ...x, status: "scoring", name: profile.fullName || r.file.name } : x));
      const match = await matchFn({ data: { cvText: text, jobTitle: job.title, requiredSkills: job.required_skills, preferredSkills: job.preferred_skills, summary: job.summary || "" } });
      setRows(rs => rs.map(x => x.id === r.id ? { ...x, status: "saving", score: match.matchScore } : x));
      const { error } = await supabase.from("session_candidates" as any).insert({
        job_id: job.id, session_id: job.session_id, class_id: job.class_id,
        name: profile.fullName || r.file.name, email: profile.email || null,
        cv_text: text.slice(0, 20000), cv_summary: profile.summary,
        skills: profile.skills, experience_years: profile.yearsExperience,
        score: match.matchScore, ai_explanation: match.recommendation,
        matching_skills: match.requiredSkillsMatched, missing_skills: match.missingSkills,
        recommendation: match.recommendation, stage: "ai_screened",
      });
      if (error) throw error;
      setRows(rs => rs.map(x => x.id === r.id ? { ...x, status: "done" } : x));
    } catch (e: any) {
      setRows(rs => rs.map(x => x.id === r.id ? { ...x, status: "error", error: e.message } : x));
    }
  }

  async function runAll() {
    setRunning(true);
    const queue = rows.filter(r => r.status === "queued");
    for (const r of queue) await processOne(r);
    setRunning(false);
    toast.success(t("screening.complete"));
  }

  return (
    <div>
      <PageHeader title={t("screening.title")} subtitle={t("screening.subtitle")} />

      {!canWrite && <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm rounded-md p-3 mb-4">{t("screening.subInactive")}</div>}

      <div className="bg-card border border-border rounded-xl p-4 mb-4 grid md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("screening.targetJob")}</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm mt-1">
            <option value="">{t("screening.pickJob")}</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          {job && <div className="text-xs text-muted-foreground mt-1">{t("screening.reqPref", { req: job.required_skills.length, pref: job.preferred_skills.length })}</div>}
        </div>
        {!jobs.length && <Link to="/ai-jobs" className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded">{t("screening.createJobFirst")}</Link>}
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />
        <ShieldCheck className="w-3 h-3" /> {t("screening.consent")}
      </label>

      <div ref={drop} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center mb-4">
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <div className="text-sm">{t("screening.drop")}</div>
        <input type="file" multiple accept=".pdf,.docx,.txt" onChange={e => e.target.files && addFiles(e.target.files)} className="hidden" id="cvUp" />
        <label htmlFor="cvUp" className="inline-block mt-2 text-xs text-primary hover:underline cursor-pointer">{t("screening.browse")}</label>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">{t("screening.queued", { n: rows.length })}</div>
            <button onClick={runAll} disabled={!canWrite || running || !job} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} {t("screening.runScreening")}
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {rows.map(r => (
              <div key={r.id} className="p-3 flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 truncate">{r.name || r.file.name}</div>
                <span className="text-xs text-muted-foreground capitalize">{r.status}</span>
                {r.score !== undefined && <span className="text-xs font-mono font-semibold text-primary">{r.score}</span>}
                {r.error && <span className="text-xs text-destructive">{r.error}</span>}
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">{t("screening.completedGoto")} <Link to="/pipeline" search={{ job: "" }} className="text-primary hover:underline">{t("screening.pipeline")}</Link>.</div>
        </>
      )}
    </div>
  );
}

export default ScreeningPage;
