import { Link, getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STAGE_LABEL, type SessionCandidate, type SessionJob, type Stage } from "@/lib/session-jobs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { X, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

const Route = getRouteApi("/present/$sessionId");



function PresentPage() {
  const { t } = useTranslation();
  const { sessionId } = Route.useParams();
  const [sess, setSess] = useState<{ title: string } | null>(null);
  const [jobs, setJobs] = useState<SessionJob[]>([]);
  const [cands, setCands] = useState<SessionCandidate[]>([]);
  const [tab, setTab] = useState<"rankings" | "pipeline" | "funnel" | "decisions">("rankings");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("sessions").select("title").eq("id", sessionId).maybeSingle();
      setSess(s as any);
      const { data: j } = await supabase.from("session_jobs" as any).select("*").eq("session_id", sessionId);
      setJobs((j as any) || []);
      const { data: c } = await supabase.from("session_candidates" as any).select("*").eq("session_id", sessionId).order("score", { ascending: false });
      setCands((c as any) || []);
    })();
  }, [sessionId]);

  const stages: Stage[] = ["applied", "ai_screened", "assessment", "shortlisted", "interview", "offer", "hired"];
  const stageLabel = (s: Stage) => t(`stages.${STAGE_LABEL[s]}` as any, { defaultValue: STAGE_LABEL[s] });
  const funnel = stages.map(s => ({ name: stageLabel(s), value: cands.filter(c => c.stage === s).length }));
  const hired = cands.filter(c => c.stage === "hired");
  const offered = cands.filter(c => c.stage === "offer");
  const tabs = { rankings: t("presenter.tabs.rankings"), pipeline: t("presenter.tabs.pipeline"), funnel: t("presenter.tabs.funnel"), decisions: t("presenter.tabs.decisions") } as const;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-50 overflow-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-5 border-b border-white/10">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/40">{t("presenter.tag")}</div>
          <h1 className="text-lg sm:text-2xl font-bold truncate">{sess?.title || t("presenter.session")}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["rankings", "pipeline", "funnel", "decisions"] as const).map(tk => (
            <button key={tk} onClick={() => setTab(tk)} className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md uppercase tracking-wider ${tab === tk ? "bg-white text-slate-950 font-semibold" : "text-white/60 hover:text-white"}`}>{tabs[tk]}</button>
          ))}
          <Link to="/sessions/$id" params={{ id: sessionId }} className="ml-1 sm:ml-3 w-9 h-9 sm:w-10 sm:h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="w-5 h-5" /></Link>
        </div>
      </header>

      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        {tab === "rankings" && (
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Trophy className="w-8 h-8 text-amber-400" /> {t("presenter.top")}</h2>
            <div className="space-y-3">
              {cands.slice(0, 10).map((c, i) => (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-5">
                  <div className="text-4xl font-bold text-white/40 w-12">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-2xl font-semibold">{c.name}</div>
                    <div className="text-sm text-white/60">{c.recommendation}</div>
                  </div>
                  <div className="text-5xl font-bold text-emerald-400 font-mono">{Math.round(c.score)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "pipeline" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">{t("presenter.stages")}</h2>
            <div className="grid grid-cols-7 gap-3 overflow-x-auto min-w-[840px]">
              {stages.map(s => {
                const items = cands.filter(c => c.stage === s);
                return (
                  <div key={s} className="bg-white/5 border border-white/10 rounded-xl p-3 min-h-[400px]">
                    <div className="text-xs uppercase tracking-wider text-white/60 mb-2 text-center">{stageLabel(s)}</div>
                    <div className="text-4xl font-bold text-center mb-3">{items.length}</div>
                    <div className="space-y-1">
                      {items.slice(0, 6).map(c => (
                        <div key={c.id} className="text-xs bg-white/5 rounded px-2 py-1 truncate">{c.name} <span className="text-emerald-400 font-mono">{Math.round(c.score)}</span></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "funnel" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">{t("presenter.funnel")}</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={funnel}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.1)" /><XAxis dataKey="name" stroke="rgba(255,255,255,.6)" /><YAxis stroke="rgba(255,255,255,.6)" /><Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,.1)", color: "white" }} /><Bar dataKey="value" fill="#10b981" /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "decisions" && (
          <div>
            <h2 className="text-3xl font-bold mb-6">{t("presenter.decisions")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Panel title={t("presenter.hired")} count={hired.length} tone="emerald" items={hired} />
              <Panel title={t("presenter.offered")} count={offered.length} tone="amber" items={offered} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function Panel({ title, count, tone, items }: { title: string; count: number; tone: "emerald" | "amber"; items: SessionCandidate[] }) {
  const c = tone === "emerald" ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30";
  return (
    <div className={`bg-white/5 border ${c} rounded-xl p-6`}>
      <div className="flex items-baseline justify-between mb-4"><div className="text-xl font-semibold">{title}</div><div className={`text-5xl font-bold ${c.split(" ")[0]}`}>{count}</div></div>
      <ul className="space-y-2">{items.map(i => <li key={i.id} className="text-sm bg-white/5 rounded px-3 py-2 flex justify-between"><span>{i.name}</span><span className="font-mono">{Math.round(i.score)}</span></li>)}</ul>
    </div>
  );
}

export default PresentPage;
