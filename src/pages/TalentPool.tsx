import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { SessionCandidate, SessionJob } from "@/lib/session-jobs";
import { ScoreBadge } from "@/pages/Candidates";
import { Brain, Trophy, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";



function TalentPoolPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pool, setPool] = useState<SessionCandidate[]>([]);
  const [jobs, setJobs] = useState<Record<string, SessionJob>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: c }, { data: j }] = await Promise.all([
        supabase.from("session_candidates" as any).select("*").in("stage", ["talent_pool", "rejected"]).order("score", { ascending: false }),
        supabase.from("session_jobs" as any).select("*"),
      ]);
      setPool(((c as any) as SessionCandidate[]) || []);
      const map: Record<string, SessionJob> = {};
      ((j as any) as SessionJob[] || []).forEach(x => { map[x.id] = x; });
      setJobs(map);
    })();
  }, [user?.id]);

  const buckets: { key: string; label: string; list: SessionCandidate[] }[] = [
    { key: "top", label: t("talentPool.top"), list: pool.filter(c => c.score >= 90 && c.stage === "talent_pool") },
    { key: "silver", label: t("talentPool.silver"), list: pool.filter(c => c.score >= 75 && c.score < 90 && c.stage === "talent_pool") },
    { key: "future", label: t("talentPool.future"), list: pool.filter(c => (c.experience_years || 0) < 3 && c.score >= 60 && c.stage === "talent_pool") },
    { key: "rejected", label: t("talentPool.rejected"), list: pool.filter(c => c.stage === "rejected") },
  ];

  return (
    <div>
      <PageHeader
        title={t("talentPool.title")}
        subtitle={t("talentPool.subtitle")}
      />

      {pool.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <div>{t("talentPool.empty")}</div>
          <div className="text-xs mt-1">{t("talentPool.emptyHint")} <Link to="/offers" className="text-primary hover:underline">{t("talentPool.offersLink")}</Link>{t("talentPool.autoMove")}</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {buckets.map(({ key, label, list }) => (
            <div key={key} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  {key === "top" ? <Trophy className="w-4 h-4 text-amber-500" /> : <Sparkles className="w-4 h-4 text-primary" />}
                  {label}
                </h2>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono">{list.length}</span>
              </div>
              <ul className="space-y-2 max-h-96 overflow-auto">
                {list.slice(0, 20).map(c => {
                  const job = jobs[c.job_id];
                  return (
                    <li key={c.id} className="p-2 rounded hover:bg-accent">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary grid place-items-center text-xs font-semibold text-primary-foreground shrink-0">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to="/candidates/$id" params={{ id: c.id }} className="text-sm font-medium hover:underline truncate block">{c.name}</Link>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {t("talentPool.applied")} <span className="text-foreground">{job?.title || "—"}</span>
                          </div>
                        </div>
                        <ScoreBadge score={c.score} />
                      </div>
                      {c.skills.length > 0 && (
                        <div className="mt-1.5 ml-11 flex flex-wrap gap-1">
                          {c.skills.slice(0, 5).map(s => (
                            <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{s}</span>
                          ))}
                          {c.skills.length > 5 && <span className="text-[10px] text-muted-foreground">+{c.skills.length - 5}</span>}
                        </div>
                      )}
                    </li>
                  );
                })}
                {list.length === 0 && <li className="text-sm text-muted-foreground">{t("talentPool.emptyBucket")}</li>}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TalentPoolPage;
