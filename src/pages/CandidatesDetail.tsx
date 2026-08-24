import { Link, getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { STAGE_LABEL, type SessionCandidate } from "@/lib/session-jobs";
import { ScoreBadge } from "@/pages/Candidates";
import { ArrowLeft, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const Route = getRouteApi("/candidates/$id");



function CandidateDetail() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const [c, setC] = useState<(SessionCandidate & { _job?: string }) | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("session_candidates" as any).select("*, session_jobs(title)").eq("id", id).maybeSingle();
      if (data) setC({ ...(data as any), _job: (data as any).session_jobs?.title });
    })();
  }, [id]);

  if (!c) return <div className="text-sm text-muted-foreground">{t("candidates.loading")}</div>;

  const stageLabel = t(`stages.${STAGE_LABEL[c.stage]}` as any, { defaultValue: STAGE_LABEL[c.stage] });

  return (
    <div>
      <Link to="/candidates" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"><ArrowLeft className="w-3 h-3" /> {t("candidates.back")}</Link>
      <PageHeader title={c.name} subtitle={`${c._job} · ${t("candidates.stage")}: ${stageLabel}`} actions={<ScoreBadge score={c.score} />} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card title={t("candidates.cvSummary")}>{c.cv_summary || "—"}</Card>
          <Card title={t("candidates.aiRecommendation")}>
            <p className="text-sm">{c.recommendation || "—"}</p>
            {c.ai_explanation && c.ai_explanation !== c.recommendation && <p className="text-xs text-muted-foreground mt-2">{c.ai_explanation}</p>}
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card title={t("candidates.matchingSkills")} tone="success">
              <div className="flex flex-wrap gap-1.5">
                {c.matching_skills.length ? c.matching_skills.map(s => <span key={s} className="text-xs bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1"><Check className="w-3 h-3" />{s}</span>) : <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </Card>
            <Card title={t("candidates.missingSkills")} tone="warn">
              <div className="flex flex-wrap gap-1.5">
                {c.missing_skills.length ? c.missing_skills.map(s => <span key={s} className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded flex items-center gap-1"><X className="w-3 h-3" />{s}</span>) : <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </Card>
          </div>
        </div>
        <div className="space-y-4">
          <Card title={t("candidates.profile")}>
            <Kv k={t("candidates.email")} v={c.email || "—"} />
            <Kv k={t("candidates.experience")} v={c.experience_years ? t("candidates.experienceYrs", { n: c.experience_years }) : "—"} />
            <Kv k={t("candidates.atsScore")} v={`${Math.round(c.score)} / 100`} />
          </Card>
          <Card title={t("candidates.allSkills")}>
            <div className="flex flex-wrap gap-1.5">{c.skills.map(s => <span key={s} className="text-xs bg-muted px-2 py-0.5 rounded">{s}</span>)}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "success" | "warn" }) {
  const border = tone === "success" ? "border-emerald-500/30" : tone === "warn" ? "border-amber-500/30" : "border-border";
  return (
    <div className={`bg-card border ${border} rounded-xl p-4`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
function Kv({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between py-1 text-sm border-b border-border last:border-0"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}

export default CandidateDetail;
