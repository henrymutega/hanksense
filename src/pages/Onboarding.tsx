import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import type { SessionCandidate, SessionJob } from "@/lib/session-jobs";
import {
  ONBOARDING_TASKS, PHASES, dayIndex, taskDate, ensurePlan, loadTaskStates,
  savePlan, setTaskDone, type OnboardingPlan, type TaskState,
} from "@/lib/onboarding";
import { CheckCircle2, Circle, CalendarDays, UserPlus, Clock, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";

function OnboardingPage() {
  const { user } = useAuth();
  const { canWrite } = useLecturerState();
  const [hires, setHires] = useState<SessionCandidate[]>([]);
  const [jobs, setJobs] = useState<Record<string, SessionJob>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plan, setPlan] = useState<OnboardingPlan | null>(null);
  const [states, setStates] = useState<Record<string, TaskState>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: c }, { data: j }] = await Promise.all([
      supabase.from("session_candidates" as any).select("*").eq("stage", "hired").order("updated_at", { ascending: false }),
      supabase.from("session_jobs" as any).select("*"),
    ]);
    const list = ((c as any) as SessionCandidate[]) || [];
    setHires(list);
    const map: Record<string, SessionJob> = {};
    (((j as any) as SessionJob[]) || []).forEach(x => { map[x.id] = x; });
    setJobs(map);
    setLoading(false);
    if (list.length && !selectedId) setSelectedId(list[0].id);
  }
  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!selectedId) { setPlan(null); setStates({}); return; }
    let live = true;
    (async () => {
      const p = await ensurePlan(selectedId);
      const s = await loadTaskStates(selectedId);
      if (!live) return;
      setPlan(p);
      setStates(s);
    })();
    return () => { live = false; };
  }, [selectedId]);

  const selected = hires.find(h => h.id === selectedId) || null;
  const job = selected ? jobs[selected.job_id] : null;

  const today = plan ? dayIndex(plan.start_date) : 0;
  const done = ONBOARDING_TASKS.filter(t => states[t.key]?.done).length;
  const pct = Math.round((done / ONBOARDING_TASKS.length) * 100);
  const overdue = useMemo(
    () => plan ? ONBOARDING_TASKS.filter(t => !states[t.key]?.done && t.day < today) : [],
    [plan, states, today],
  );
  const dueNow = useMemo(
    () => plan ? ONBOARDING_TASKS.filter(t => !states[t.key]?.done && t.day >= today && t.day <= today + 2) : [],
    [plan, states, today],
  );

  async function toggle(key: string) {
    if (!selected || !canWrite) return;
    const next = !states[key]?.done;
    setStates(s => ({ ...s, [key]: { task_key: key, done: next, completed_at: next ? new Date().toISOString() : null } }));
    await setTaskDone(selected.id, key, next);
  }

  async function updatePlan(patch: Partial<OnboardingPlan>) {
    if (!selected || !plan) return;
    setPlan({ ...plan, ...patch });
    await savePlan(selected.id, patch);
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading onboarding…</div>;

  return (
    <div>
      <PageHeader
        title="Onboarding"
        subtitle="Every accepted hire gets a real day-by-day onboarding journey — pre-boarding, week one, then the 30 / 60 / 90-day milestones, tracked as the days pass."
      />

      {hires.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <div>No hired candidates yet.</div>
          <div className="text-xs mt-1">Accept an offer in <Link to="/offers" className="text-primary hover:underline">Offers</Link> and the new hire appears here automatically.</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="bg-card border border-border rounded-xl p-3 h-fit">
            <h2 className="font-semibold text-sm px-2 py-2 flex items-center gap-2"><Users className="w-4 h-4" /> New hires</h2>
            <ul className="space-y-1">
              {hires.map(h => (
                <li key={h.id}>
                  <button
                    onClick={() => setSelectedId(h.id)}
                    className={`w-full text-left p-2.5 rounded-md text-sm flex items-center gap-2 ${selectedId === h.id ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                    <div className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-semibold text-primary-foreground bg-primary shrink-0">
                      {h.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-medium">{h.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{jobs[h.job_id]?.title || "—"}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selected && plan && (
            <div className="space-y-4 min-w-0">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-lg">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground">{job?.title || "—"} · {job?.department || "—"} · {selected.email || "no email"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {today < 1 ? `Starts in ${Math.abs(today)} day${Math.abs(today) === 1 ? "" : "s"}` : `Day ${today} of onboarding`}
                    </div>
                    <div className="text-2xl font-semibold text-primary">{pct}%</div>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{done} of {ONBOARDING_TASKS.length} steps complete</div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
                  <label className="block">
                    <span className="text-xs font-medium block mb-1">Start date</span>
                    <input type="date" value={plan.start_date} disabled={!canWrite}
                      onChange={e => updatePlan({ start_date: e.target.value })} className={inp} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium block mb-1">Manager</span>
                    <input value={plan.manager || ""} disabled={!canWrite} placeholder="Hiring manager"
                      onBlur={e => updatePlan({ manager: e.target.value })}
                      onChange={e => setPlan({ ...plan, manager: e.target.value })} className={inp} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium block mb-1">Buddy</span>
                    <input value={plan.buddy || ""} disabled={!canWrite} placeholder="Onboarding buddy"
                      onBlur={e => updatePlan({ buddy: e.target.value })}
                      onChange={e => setPlan({ ...plan, buddy: e.target.value })} className={inp} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium block mb-1">Notes</span>
                    <input value={plan.notes || ""} disabled={!canWrite} placeholder="e.g. relocating"
                      onBlur={e => updatePlan({ notes: e.target.value })}
                      onChange={e => setPlan({ ...plan, notes: e.target.value })} className={inp} />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-accent text-xs flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Due now ({dueNow.length}):</strong> {dueNow.slice(0, 3).map(t => t.title).join(" · ") || "nothing scheduled in the next 2 days"}</span>
                  </div>
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${overdue.length ? "bg-destructive/10 text-destructive" : "bg-muted/50"}`}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Overdue ({overdue.length}):</strong> {overdue.slice(0, 3).map(t => t.title).join(" · ") || "nothing overdue"}</span>
                  </div>
                </div>
              </div>

              {PHASES.map(phase => {
                const tasks = ONBOARDING_TASKS.filter(t => t.day >= phase.from && t.day <= phase.to);
                if (!tasks.length) return null;
                const phaseDone = tasks.filter(t => states[t.key]?.done).length;
                const active = today >= phase.from && today <= phase.to;
                return (
                  <div key={phase.key} className={`bg-card border rounded-xl p-4 ${active ? "border-primary/50" : "border-border"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" /> {phase.label}
                        {active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Current</span>}
                      </h3>
                      <span className="text-xs text-muted-foreground">{phaseDone}/{tasks.length}</span>
                    </div>
                    <ul className="space-y-2">
                      {tasks.map(task => {
                        const st = states[task.key];
                        const when = taskDate(plan.start_date, task.day);
                        const isOverdue = !st?.done && task.day < today;
                        return (
                          <li key={task.key}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${st?.done ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5" : isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                            <button onClick={() => toggle(task.key)} disabled={!canWrite} className="shrink-0" aria-label="Toggle step">
                              {st?.done
                                ? <CheckCircle2 className="w-5 h-5 text-[color:var(--success)]" />
                                : <Circle className="w-5 h-5 text-muted-foreground" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm ${st?.done ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {task.day > 0 ? `Day ${task.day}` : `${Math.abs(task.day)} days before start`} · {when.toLocaleDateString()} · {task.owner} · {task.category}
                              </div>
                            </div>
                            {st?.done && st.completed_at && (
                              <span className="text-[10px] text-muted-foreground hidden sm:block">
                                done {new Date(st.completed_at).toLocaleDateString()}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              {canWrite && pct === 100 && (
                <button
                  onClick={() => toast.success(`${selected.name} has completed onboarding 🎉`)}
                  className="w-full bg-[color:var(--success)] text-[color:var(--success-foreground)] py-2.5 rounded-md text-sm font-medium">
                  Mark onboarding complete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inp = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm disabled:opacity-60";

export default OnboardingPage;
