import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { SessionJob } from "@/lib/session-jobs";
import { ArrowLeft, Copy, ExternalLink, MapPin, Users, Briefcase, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getPublicApplyUrl } from "@/lib/public-apply-url";

const Route = getRouteApi("/jobs_/$id");

type Row = SessionJob & {
  created_by?: string;
  _class?: string;
  _session?: string;
  _authorName?: string;
  _authorIsLecturer?: boolean;
  _candidates?: number;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Chips({ items, tone = "muted" }: { items: string[]; tone?: "primary" | "muted" }) {
  if (!items?.length) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(s => (
        <span key={s} className={`text-xs px-2 py-0.5 rounded ${tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted"}`}>{s}</span>
      ))}
    </div>
  );
}

export default function JobDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const nav = useNavigate();
  const [job, setJob] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyUrl, setApplyUrl] = useState("");

  useEffect(() => {
    setApplyUrl(getPublicApplyUrl(id));
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("session_jobs" as any)
        .select("*, classes(name, course_code, lecturer_id), sessions(title), session_candidates(id)")
        .eq("id", id)
        .maybeSingle();
      const j = data as any;
      if (!j) { setJob(null); setLoading(false); return; }
      let authorName = "Unknown";
      if (j.created_by) {
        const { data: p } = await supabase.from("profiles").select("full_name, email").eq("id", j.created_by).maybeSingle();
        authorName = (p as any)?.full_name || (p as any)?.email || "Unknown";
      }
      setJob({
        ...j,
        _class: j.classes ? (j.classes.course_code ? `${j.classes.course_code} · ${j.classes.name}` : j.classes.name) : "—",
        _session: j.sessions?.title || "—",
        _candidates: j.session_candidates?.length ?? 0,
        _authorName: authorName,
        _authorIsLecturer: !!j.classes && j.created_by === j.classes.lecturer_id,
      });
      setLoading(false);
    })();
  }, [id]);

  const canManage = !!job && (role === "lecturer" || role === "admin" || job.created_by === user?.id);

  function copyLink() {
    navigator.clipboard.writeText(applyUrl);
    toast.success(t("jobs.linkCopied"));
  }

  if (loading) return <div className="text-sm text-muted-foreground py-10 text-center">{t("jobs.loading")}</div>;
  if (!job) return (
    <div className="text-center py-16">
      <p className="text-sm text-muted-foreground mb-4">{t("jobDetail.notFound")}</p>
      <Link to="/jobs" className="text-primary hover:underline text-sm">{t("jobDetail.back")}</Link>
    </div>
  );

  const money = (n: number | null) => (n ? `${job.salary_currency || "USD"} ${Number(n).toLocaleString()}` : null);
  const pay = [money(job.salary_min), money(job.salary_max)].filter(Boolean).join(" – ");

  return (
    <div className="space-y-4">
      <Link to="/jobs" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> {t("jobDetail.back")}
      </Link>

      <PageHeader
        title={job.title}
        subtitle={`${job._class} → ${job._session}`}
        actions={canManage && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => nav({ to: "/screening", search: { job: job.id } as any })} className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded">{t("jobDetail.screening")}</button>
            <Link to="/pipeline" search={{ job: job.id } as any} className="text-xs border border-border px-3 py-2 rounded hover:bg-accent">{t("jobDetail.pipeline")}</Link>
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded"><Briefcase className="w-3 h-3" />{job.department || "—"}</span>
        <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded"><MapPin className="w-3 h-3" />{job.location || "—"} · {job.work_mode || "—"}</span>
        <span className="bg-muted px-2 py-1 rounded">{job.employment_type || "—"}</span>
        <span className="bg-muted px-2 py-1 rounded">{job.seniority || "—"}</span>
        <span className="bg-muted px-2 py-1 rounded">{job.openings} openings</span>
        <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded"><Users className="w-3 h-3" />{job._candidates} {t("jobDetail.applicants")}</span>
        <span className={`px-2 py-1 rounded uppercase ${job.status === "posted" ? "bg-primary/10 text-primary" : "bg-muted"}`}>{job.status}</span>
      </div>

      {/* Public apply link */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />{t("jobDetail.applyLink")}</h2>
        <p className="text-xs text-muted-foreground mb-2">{t("jobDetail.applyLinkHint")}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input readOnly value={applyUrl} className="flex-1 min-w-0 bg-background border border-border rounded-md px-3 py-2 text-xs font-mono" />
          <div className="flex gap-2">
            <button onClick={copyLink} className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded inline-flex items-center gap-1"><Copy className="w-3 h-3" />{t("jobDetail.copy")}</button>
            <a href={applyUrl} target="_blank" rel="noreferrer" className="text-xs border border-border px-3 py-2 rounded hover:bg-accent inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />{t("jobDetail.open")}</a>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title={t("jobDetail.overview")}>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{job.summary || "—"}</p>
        </Section>
        <Section title={t("jobDetail.responsibilities")}>
          {job.responsibilities?.length ? (
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          ) : <span className="text-sm text-muted-foreground">—</span>}
        </Section>
        <Section title={t("jobDetail.requiredSkills")}><Chips items={job.required_skills} tone="primary" /></Section>
        <Section title={t("jobDetail.preferredSkills")}><Chips items={job.preferred_skills} /></Section>
        <Section title={t("jobDetail.education")}><p className="text-sm text-muted-foreground">{job.education || "—"}</p></Section>
        <Section title={t("jobDetail.experience")}><p className="text-sm text-muted-foreground">{job.experience || "—"}</p></Section>
        <Section title={t("jobDetail.compensation")}><p className="text-sm text-muted-foreground">{pay || "—"}</p></Section>
        <Section title={t("jobDetail.benefits")}><Chips items={job.benefits} /></Section>
        <Section title={t("jobDetail.process")}>
          {job.interview_stages?.length ? (
            <ol className="text-sm text-muted-foreground list-decimal pl-4 space-y-1">
              {job.interview_stages.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          ) : <span className="text-sm text-muted-foreground">—</span>}
        </Section>
        {!!job.bias_notes?.length && (
          <Section title={t("jobDetail.biasNotes")}>
            <ul className="text-sm text-muted-foreground space-y-1">
              {job.bias_notes.map((b, i) => <li key={i}><span className="line-through">{b.term}</span> → <span className="text-foreground">{b.suggest}</span> <span className="text-xs">({b.reason})</span></li>)}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
