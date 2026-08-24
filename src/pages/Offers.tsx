import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import type { SessionCandidate, SessionJob } from "@/lib/session-jobs";
import { updateCandidateStage, moveToTalentPool } from "@/lib/pipeline-flow";
import { FileText, ShieldCheck, Mail, Edit3, CheckCircle2, X, Send } from "lucide-react";
import { toast } from "sonner";



type OfferDraft = {
  candidateId: string;
  jobTitle: string;
  department: string;
  reportTo: string;
  baseSalary: number;
  currency: string;
  bonus: number;
  equity: string;
  startDate: string;
  workMode: string;
  location: string;
  benefits: string[];
  expiresInDays: number;
  customClauses: string;
  status: "Draft" | "Sent" | "Accepted" | "Declined";
};

function OffersPage() {
  const { user } = useAuth();
  const { canWrite } = useLecturerState();
  const [cands, setCands] = useState<SessionCandidate[]>([]);
  const [jobs, setJobs] = useState<Record<string, SessionJob>>({});
  const [drafts, setDrafts] = useState<Record<string, OfferDraft>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    const [{ data: c }, { data: j }] = await Promise.all([
      supabase.from("session_candidates" as any).select("*").in("stage", ["offer", "hired"]).order("score", { ascending: false }),
      supabase.from("session_jobs" as any).select("*"),
    ]);
    setCands(((c as any) as SessionCandidate[]) || []);
    const map: Record<string, SessionJob> = {};
    ((j as any) as SessionJob[] || []).forEach(x => { map[x.id] = x; });
    setJobs(map);
  }
  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!selectedId && cands[0]) setSelectedId(cands[0].id);
  }, [cands, selectedId]);

  const selected = cands.find(c => c.id === selectedId);
  const job = selected ? jobs[selected.job_id] : null;

  const draft = useMemo<OfferDraft | null>(() => {
    if (!selected) return null;
    if (drafts[selected.id]) return drafts[selected.id];
    const baseFromJob = job?.salary_max || job?.salary_min || (90000 + (selected.experience_years || 3) * 6000);
    return {
      candidateId: selected.id,
      jobTitle: job?.title || "Open Role",
      department: job?.department || "—",
      reportTo: "Hiring Manager",
      baseSalary: Number(baseFromJob),
      currency: job?.salary_currency || "USD",
      bonus: Math.round(Number(baseFromJob) * 0.1),
      equity: "0.05%",
      startDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      workMode: job?.work_mode || "Hybrid",
      location: job?.location || "Remote",
      benefits: job?.benefits?.length ? job.benefits : ["Health insurance", "Annual bonus", "Learning budget"],
      expiresInDays: 7,
      customClauses: "",
      status: selected.stage === "hired" ? "Accepted" : "Draft",
    };
  }, [selected, job, drafts]);

  function updateDraft(patch: Partial<OfferDraft>) {
    if (!selected || !draft) return;
    setDrafts(d => ({ ...d, [selected.id]: { ...draft, ...patch } }));
  }

  function sendOffer() {
    if (!selected || !draft) return;
    setDrafts(d => ({ ...d, [selected.id]: { ...draft, status: "Sent" } }));
    toast.success(`Offer sent to ${selected.email || selected.name}`, {
      description: `${draft.jobTitle} · ${draft.currency} ${draft.baseSalary.toLocaleString()} base`,
    });
  }

  async function markAccepted() {
    if (!selected || !draft) return;
    setDrafts(d => ({ ...d, [selected.id]: { ...draft, status: "Accepted" } }));
    await updateCandidateStage(selected.id, "hired");
    toast.success(`${selected.name} hired — other applicants moved to Talent Pool`);
    load();
  }

  async function markDeclined() {
    if (!selected || !draft) return;
    setDrafts(d => ({ ...d, [selected.id]: { ...draft, status: "Declined" } }));
    await moveToTalentPool(selected.id);
    toast(`${selected.name} declined — saved to Talent Pool`);
    load();
  }

  return (
    <div>
      <PageHeader title="Offers" subtitle="Generate offer letters for candidates promoted from Interview. Acceptance hires them and sends every other applicant for that role to the Talent Pool." />

      {cands.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <div>No candidates in Offer stage yet.</div>
          <div className="text-xs mt-1">Move someone from Interviews to Offer.</div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr_1fr] gap-6">
          <div className="bg-card border border-border rounded-xl p-3 h-fit">
            <h2 className="font-semibold text-sm px-2 py-2">Offers in progress</h2>
            <ul className="space-y-1">
              {cands.map(c => {
                const d = drafts[c.id];
                const status = d?.status || (c.stage === "hired" ? "Accepted" : "Draft");
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left p-2.5 rounded-md text-sm flex items-center gap-2 ${
                        selectedId === c.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                      }`}>
                      <div className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-semibold text-primary-foreground bg-primary shrink-0">
                        {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-medium">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">{status} · {jobs[c.job_id]?.title || "—"}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected && draft && (
            <>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2"><Edit3 className="w-4 h-4 text-primary" /> Editable offer</h2>
                  <StatusBadge status={draft.status} />
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Job title"><input value={draft.jobTitle} onChange={e => updateDraft({ jobTitle: e.target.value })} className={inp} /></Field>
                    <Field label="Department"><input value={draft.department} onChange={e => updateDraft({ department: e.target.value })} className={inp} /></Field>
                  </div>
                  <Field label="Reports to"><input value={draft.reportTo} onChange={e => updateDraft({ reportTo: e.target.value })} className={inp} /></Field>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Base salary"><input type="number" value={draft.baseSalary} onChange={e => updateDraft({ baseSalary: +e.target.value })} className={inp} /></Field>
                    <Field label="Bonus target"><input type="number" value={draft.bonus} onChange={e => updateDraft({ bonus: +e.target.value })} className={inp} /></Field>
                    <Field label="Currency">
                      <select value={draft.currency} onChange={e => updateDraft({ currency: e.target.value })} className={inp}>
                        {["USD", "EUR", "GBP", "INR", "SGD", "AUD"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Equity"><input value={draft.equity} onChange={e => updateDraft({ equity: e.target.value })} className={inp} /></Field>
                    <Field label="Start date"><input type="date" value={draft.startDate} onChange={e => updateDraft({ startDate: e.target.value })} className={inp} /></Field>
                    <Field label="Expires (days)"><input type="number" value={draft.expiresInDays} onChange={e => updateDraft({ expiresInDays: +e.target.value })} className={inp} /></Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Work mode">
                      <select value={draft.workMode} onChange={e => updateDraft({ workMode: e.target.value })} className={inp}>
                        {["Remote", "Hybrid", "Onsite"].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Location"><input value={draft.location} onChange={e => updateDraft({ location: e.target.value })} className={inp} /></Field>
                  </div>
                  <Field label="Benefits (comma-separated)">
                    <textarea value={draft.benefits.join(", ")}
                      onChange={e => updateDraft({ benefits: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      rows={2} className={inp} />
                  </Field>
                  <Field label="Custom clauses"><textarea value={draft.customClauses} onChange={e => updateDraft({ customClauses: e.target.value })} rows={3} className={inp} /></Field>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-accent text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Equity check:</strong> {job?.salary_min && draft.baseSalary >= Number(job.salary_min) && draft.baseSalary <= Number(job.salary_max || job.salary_min) ? "✓ within posted band" : "⚠ outside posted band — verify with comp"}</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Letter preview</h2>
                  <span className="text-xs text-muted-foreground truncate">{selected.email}</span>
                </div>

                <div className="bg-muted/40 border border-border rounded-lg p-5 text-sm font-serif max-h-[440px] overflow-y-auto">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">HireSense · Confidential</div>
                  <p>Dear <strong>{selected.name}</strong>,</p>
                  <p className="mt-2">We are delighted to extend an offer for <strong>{draft.jobTitle}</strong> in the <strong>{draft.department}</strong> team, reporting to the {draft.reportTo}.</p>
                  <p className="mt-2"><strong>Compensation:</strong> {draft.currency} {draft.baseSalary.toLocaleString()} base, target bonus {draft.currency} {draft.bonus.toLocaleString()}. Equity: {draft.equity}.</p>
                  <p className="mt-2"><strong>Start date:</strong> {draft.startDate} · <strong>Work mode:</strong> {draft.workMode} ({draft.location}).</p>
                  <p className="mt-2"><strong>Benefits:</strong> {draft.benefits.join(", ")}.</p>
                  {draft.customClauses && <p className="mt-2 whitespace-pre-wrap">{draft.customClauses}</p>}
                  <p className="mt-2 text-xs">Valid for <strong>{draft.expiresInDays} days</strong>.</p>
                  <p className="mt-3">Warm regards,<br/>HireSense Hiring Team</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {draft.status === "Draft" && canWrite && (
                    <button onClick={sendOffer} className="col-span-2 bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium inline-flex items-center justify-center gap-1.5">
                      <Send className="w-4 h-4" /> Approve & send
                    </button>
                  )}
                  {draft.status === "Sent" && canWrite && (
                    <>
                      <button onClick={markAccepted} className="bg-[color:var(--success)] text-[color:var(--success-foreground)] py-2.5 rounded-md text-sm font-medium inline-flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Mark accepted
                      </button>
                      <button onClick={markDeclined} className="border border-border py-2.5 rounded-md text-sm inline-flex items-center justify-center gap-1.5 hover:bg-accent">
                        <X className="w-4 h-4" /> Mark declined
                      </button>
                    </>
                  )}
                  {draft.status === "Accepted" && (
                    <div className="col-span-2 text-center text-sm text-[color:var(--success)] py-2">✓ Hired — others moved to Talent Pool</div>
                  )}
                  {draft.status === "Declined" && (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-2">Declined — moved to Talent Pool</div>
                  )}
                </div>

                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Candidate score: <span className="font-mono text-foreground">{Math.round(selected.score)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inp = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium block mb-1">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: OfferDraft["status"] }) {
  const map = {
    Draft: "bg-accent text-accent-foreground",
    Sent: "bg-primary/10 text-primary",
    Accepted: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
    Declined: "bg-destructive/10 text-destructive",
  };
  return <span className={`text-xs px-2 py-1 rounded-full ${map[status]}`}>{status}</span>;
}

export default OffersPage;
