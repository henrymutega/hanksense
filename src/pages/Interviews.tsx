import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import type { SessionCandidate, SessionJob } from "@/lib/session-jobs";
import { updateCandidateStage } from "@/lib/pipeline-flow";
import { useInterviews, scheduleInterview, deleteInterview, updateInterview, type ScheduledInterview } from "@/lib/interviewsStore";
import { Video, Clock, Sparkles, Mail, CalendarCheck, X, ExternalLink, Trash2, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight, CalendarPlus, Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";



const SLOTS = ["09:00", "10:30", "13:00", "14:30", "16:00"];
const INTERVIEW_TYPES: ScheduledInterview["type"][] = ["Phone Screen", "Technical", "Panel", "Final"];
const PANEL_POOL = ["Sarah Chen (Eng Mgr)", "Marcus Lee (Senior Eng)", "Priya R. (Tech Lead)", "James K. (Product)", "Dr. Recruiter (HR)"];

// ----- Real-date helpers -----
function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1 - day); // Monday as start
  x.setDate(x.getDate() + diff);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function labelFor(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function weekDays(monday: Date) {
  return Array.from({ length: 5 }, (_, i) => addDays(monday, i));
}

function toIcsDate(dateISO: string, time: string, durationMin: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const start = new Date(y, m - 1, d, hh, mm);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const fmt = (x: Date) =>
    `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
  return { start: fmt(start), end: fmt(end) };
}

function downloadIcs(iv: ScheduledInterview, missingDateMsg = "Interview is missing a calendar date") {
  if (!iv.dateISO) { toast.error(missingDateMsg); return; }
  const { start, end } = toIcsDate(iv.dateISO, iv.time, iv.durationMin);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HireSense//Interviews//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${iv.id}@hiresense`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${iv.type} – ${iv.candidateName}${iv.jobTitle ? ` (${iv.jobTitle})` : ""}`,
    `DESCRIPTION:Interview with ${iv.candidateName}\\nPanel: ${iv.interviewers.join(", ")}\\nMeeting: ${iv.meetingUrl}`,
    `LOCATION:${iv.meetingUrl}`,
    ...iv.interviewers.map(p => `ATTENDEE;CN=${p}:mailto:panel@hiresense.ai`),
    `ATTENDEE;CN=${iv.candidateName}:mailto:${iv.candidateEmail}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `interview-${iv.candidateName.replace(/\s+/g, "-")}-${iv.dateISO}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function googleCalUrl(iv: ScheduledInterview) {
  if (!iv.dateISO) return "#";
  const { start, end } = toIcsDate(iv.dateISO, iv.time, iv.durationMin);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${iv.type} – ${iv.candidateName}${iv.jobTitle ? ` (${iv.jobTitle})` : ""}`,
    dates: `${start}/${end}`,
    details: `Interview with ${iv.candidateName}\nPanel: ${iv.interviewers.join(", ")}\nMeeting: ${iv.meetingUrl}`,
    location: iv.meetingUrl,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function InterviewsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canWrite } = useLecturerState();
  const interviews = useInterviews();
  const [cands, setCands] = useState<SessionCandidate[]>([]);
  const [jobs, setJobs] = useState<Record<string, SessionJob>>({});
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const todayISO = toISO(new Date());
  const nowHM = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
  const currentWeekStartISO = toISO(startOfWeek(new Date()));
  const canGoPrevWeek = toISO(weekStart) > currentWeekStartISO;

  // Pick a non-past suggested day/slot for a given candidate index.
  function suggestedFor(i: number): { day: Date; slot: string } {
    for (let offset = 0; offset < 14; offset++) {
      const cand = addDays(days[i % 5], offset);
      const iso = toISO(cand);
      if (iso < todayISO) continue;
      const slots = iso === todayISO ? SLOTS.filter(s => s > nowHM) : SLOTS;
      if (!slots.length) continue;
      return { day: cand, slot: slots[(i + 1) % slots.length] };
    }
    return { day: addDays(new Date(), 1), slot: SLOTS[0] };
  }

  const typeLabel = (tp: ScheduledInterview["type"]) => {
    const map: Record<string, string> = {
      "Phone Screen": t("t:interviews.typePhone"),
      "Technical": t("t:interviews.typeTechnical"),
      "Panel": t("t:interviews.typePanel"),
      "Final": t("t:interviews.typeFinal"),
    };
    return map[tp] || tp;
  };
  const statusLabel = (s: ScheduledInterview["status"]) => {
    const map: Record<string, string> = {
      "Scheduled": t("t:interviews.statusScheduled"),
      "In Progress": t("t:interviews.statusInProgress"),
      "Completed": t("t:interviews.statusCompleted"),
      "Cancelled": t("t:interviews.statusCancelled"),
    };
    return map[s] || s;
  };

  async function load() {
    const [{ data: c }, { data: j }] = await Promise.all([
      supabase.from("session_candidates" as any).select("*").in("stage", ["shortlisted", "interview"]).order("score", { ascending: false }),
      supabase.from("session_jobs" as any).select("*"),
    ]);
    setCands(((c as any) as SessionCandidate[]) || []);
    const map: Record<string, SessionJob> = {};
    ((j as any) as SessionJob[] || []).forEach(x => { map[x.id] = x; });
    setJobs(map);
  }
  useEffect(() => { load(); }, [user?.id]);

  const eligible = useMemo(() => cands.slice(0, 20), [cands]);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const candidateForDialog = eligible.find(c => c.id === openFor);

  async function promoteToOffer(cid: string) {
    if (!canWrite) return;
    await updateCandidateStage(cid, "offer");
    toast.success(t("t:interviews.movedToOffer"));
    load();
  }

  const weekLabel = `${days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${days[4].toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div>
      <PageHeader
        title={t("t:interviews.title")}
        subtitle={t("t:interviews.subtitle")}
      />


      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {t("t:interviews.readyToInterview")}</h2>
          {eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("t:interviews.noEligibleShort")} <Link to="/pipeline" search={{ job: "" }} className="text-primary hover:underline">{t("t:interviews.thePipeline")}</Link>.</p>
          ) : (
            <ul className="divide-y divide-border -mx-2">
              {eligible.map((c, i) => {
                const job = jobs[c.job_id];
                const { day: suggestedDay, slot: suggestedSlot } = suggestedFor(i);
                const already = interviews.find(iv => iv.candidateId === c.id && iv.status !== "Cancelled");
                return (
                  <li key={c.id} className="px-2 py-3 flex flex-wrap items-center gap-3">
                    <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground bg-primary shrink-0">
                      {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{job?.title || "—"} · Score {Math.round(c.score)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {t("t:interviews.suggested")} <span className="text-foreground font-medium">{labelFor(suggestedDay)} · {suggestedSlot}</span>
                    </div>
                    {already ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs bg-[color:var(--success)]/10 text-[color:var(--success)] px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> {t("t:interviews.scheduled")}
                        </span>
                        {canWrite && (
                          <button onClick={() => promoteToOffer(c.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md inline-flex items-center gap-1">
                            {t("t:interviews.moveToOffer")} <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    ) : canWrite ? (
                      <button
                        onClick={() => setOpenFor(c.id)}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md inline-flex items-center gap-1"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" /> {t("t:interviews.pickSlot")}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {t("t:interviews.thisWeek")}</h2>
          <div className="text-3xl font-bold">{interviews.filter(i => i.status === "Scheduled").length}</div>
          <div className="text-xs text-muted-foreground mb-4">{t("t:interviews.scheduledInterviews")}</div>
          <div className="space-y-1.5 text-xs">
            <Row label={t("t:interviews.completed")} value={interviews.filter(i => i.status === "Completed").length} />
            <Row label={t("t:interviews.inProgress")} value={interviews.filter(i => i.status === "In Progress").length} />
            <Row label={t("t:interviews.cancelled")} value={interviews.filter(i => i.status === "Cancelled").length} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" /> {t("t:interviews.scheduledInterviewsTitle")}</h2>
        {interviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("t:interviews.noneScheduled")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr><th className="py-2 pr-3">{t("t:interviews.candidate")}</th><th className="pr-3">{t("t:interviews.job")}</th><th className="pr-3">{t("t:interviews.type")}</th><th className="pr-3">{t("t:interviews.when")}</th><th className="pr-3">{t("t:interviews.status")}</th><th></th></tr>
              </thead>
              <tbody>
                {[...interviews]
                  .sort((a, b) => (a.dateISO || "").localeCompare(b.dateISO || "") || a.time.localeCompare(b.time))
                  .map(iv => (
                  <tr key={iv.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium">{iv.candidateName}</div>
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Mail className="w-3 h-3" />{iv.candidateEmail}</div>
                    </td>
                    <td className="pr-3 text-xs">{iv.jobTitle || "—"}</td>
                    <td className="pr-3">{typeLabel(iv.type)}</td>

                    <td className="pr-3 text-xs">
                      <div>{iv.day}</div>
                      <div className="text-muted-foreground">{iv.time} · {iv.durationMin}m</div>
                    </td>
                    <td className="pr-3">
                      <select value={iv.status} onChange={e => updateInterview(iv.id, { status: e.target.value as any })} className="text-xs bg-background border border-border rounded px-1.5 py-0.5">
                        {(["Scheduled", "In Progress", "Completed", "Cancelled"] as const).map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <a href={googleCalUrl(iv)} target="_blank" rel="noreferrer" title={t("t:interviews.addToGoogleTitle")} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded inline-flex items-center gap-1 mr-1">
                        <CalendarPlus className="w-3 h-3" /> Google
                      </a>
                      <button onClick={() => downloadIcs(iv, t("t:interviews.missingDate"))} title={t("t:interviews.downloadIcs")} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded inline-flex items-center gap-1 mr-1">
                        <Download className="w-3 h-3" /> .ics
                      </button>
                      {iv.status === "Completed" && canWrite && (
                        <button onClick={() => promoteToOffer(iv.candidateId)} className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded inline-flex items-center gap-1 mr-1">
                          {t("t:interviews.toOffer")} <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <Link to="/interview-room/$id" params={{ id: iv.id }} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded inline-flex items-center gap-1">
                        <Video className="w-3 h-3" /> {t("t:interviews.room")} <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button onClick={() => { deleteInterview(iv.id); toast(t("t:interviews.removed")); }} className="ml-1 p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold">{t("t:interviews.calendarOverview")}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => canGoPrevWeek && setWeekStart(addDays(weekStart, -7))}
              disabled={!canGoPrevWeek}
              className="p-1.5 border border-border rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              title={canGoPrevWeek ? t("t:interviews.prevWeek") : t("t:interviews.pastDateTime")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-2">{weekLabel}</span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-1.5 border border-border rounded hover:bg-accent" title={t("t:interviews.nextWeek")}>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="text-xs px-2 py-1 border border-border rounded hover:bg-accent">{t("t:interviews.today")}</button>
          </div>

        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-1 text-xs min-w-[640px]">
            <div></div>
            {days.map(d => {
              const iso = toISO(d);
              const isToday = iso === todayISO;
              const isPast = iso < todayISO;
              return (
                <div key={iso} className={`font-medium text-center py-2 rounded ${isToday ? "bg-primary/15 text-primary" : isPast ? "bg-muted/40 text-muted-foreground/60" : "bg-accent/40"}`}>
                  {labelFor(d)}
                </div>
              );
            })}
            {SLOTS.map(slot => (
              <Fragment key={slot}>
                <div className="text-right pr-2 py-3 text-muted-foreground">{slot}</div>
                {days.map(d => {
                  const iso = toISO(d);
                  const past = iso < todayISO || (iso === todayISO && slot < nowHM);
                  const here = interviews.filter(i => i.dateISO === iso && i.time === slot && i.status !== "Cancelled");
                  return (
                    <div key={iso + slot} title={past ? t("t:interviews.pastDateTime") : undefined}
                      className={`rounded p-1.5 min-h-[52px] border ${past ? "border-border/40 bg-muted/20 opacity-50" : here.length ? "border-primary/30 bg-primary/10" : "border-dashed border-border/60 bg-background/40"}`}>
                      {here.map(iv => (
                        <Link key={iv.id} to="/interview-room/$id" params={{ id: iv.id }} className="block">
                          <div className="font-medium truncate text-[11px]">{iv.candidateName}</div>
                          <div className="text-[10px] text-muted-foreground">{typeLabel(iv.type)}</div>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {candidateForDialog && (() => {
        const idx = eligible.findIndex(c => c.id === candidateForDialog.id);
        const { day: sDay, slot: sSlot } = suggestedFor(idx);
        return (
        <ScheduleDialog
          candidate={candidateForDialog}
          jobTitle={jobs[candidateForDialog.job_id]?.title}
          weekStart={startOfWeek(sDay)}
          defaultDate={sDay}
          defaultSlot={sSlot}
          onClose={() => setOpenFor(null)}
          onScheduled={async () => {
            await updateCandidateStage(candidateForDialog.id, "interview");
            load();
          }}
        />
        );
      })()}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono">{value}</span></div>;
}

function ScheduleDialog({
  candidate, jobTitle, weekStart, defaultDate, defaultSlot, onClose, onScheduled,
}: {
  candidate: SessionCandidate;
  jobTitle?: string;
  weekStart: Date;
  defaultDate: Date;
  defaultSlot: string;
  onClose: () => void;
  onScheduled: () => void;
}) {
  const { t } = useTranslation();
  const [weekRef, setWeekRef] = useState<Date>(weekStart);
  const [dateISO, setDateISO] = useState<string>(toISO(defaultDate));
  const [time, setTime] = useState(defaultSlot);
  const [type, setType] = useState<ScheduledInterview["type"]>("Technical");
  const [duration, setDuration] = useState(45);
  const [panel, setPanel] = useState<string[]>([PANEL_POOL[0], PANEL_POOL[1]]);
  const days = weekDays(weekRef);

  const typeLabel = (tp: ScheduledInterview["type"]) => {
    const map: Record<string, string> = {
      "Phone Screen": t("t:interviews.typePhone"),
      "Technical": t("t:interviews.typeTechnical"),
      "Panel": t("t:interviews.typePanel"),
      "Final": t("t:interviews.typeFinal"),
    };
    return map[tp] || tp;
  };

  function togglePanel(p: string) {
    setPanel(curr => curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p]);
  }

  const now = new Date();
  const todayISO = toISO(now);
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isPastDate = (iso: string) => iso < todayISO;
  const isPastSlot = (iso: string, hm: string) => iso < todayISO || (iso === todayISO && hm < nowHM);

  async function confirm() {
    if (!panel.length) { toast.error(t("t:interviews.pickInterviewer")); return; }
    if (isPastSlot(dateISO, time)) { toast.error(t("t:interviews.pastDateTime")); return; }
    const chosen = days.find(d => toISO(d) === dateISO) || defaultDate;
    const iv = scheduleInterview({
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email || "candidate@example.com",
      jobId: candidate.job_id,
      jobTitle,
      type, day: labelFor(chosen), dateISO: toISO(chosen), time, durationMin: duration, interviewers: panel,
    });
    await onScheduled();
    toast.success(t("t:interviews.inviteSent", { to: candidate.email || candidate.name }), {
      description: `${typeLabel(type)} · ${labelFor(chosen)} ${time}`,
      action: { label: t("t:interviews.addToGoogle"), onClick: () => window.open(googleCalUrl(iv), "_blank") },
    });
    onClose();
  }

  const weekLabel = `${days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${days[4].toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold">{t("t:interviews.scheduleTitle")} · {candidate.name}</h3>
            <p className="text-xs text-muted-foreground">{candidate.email}{jobTitle && ` · ${jobTitle}`}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("t:interviews.interviewType")}>
              <select value={type} onChange={e => setType(e.target.value as ScheduledInterview["type"])} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {INTERVIEW_TYPES.map(tp => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
              </select>
            </Field>
            <Field label={t("t:interviews.durationMin")}>
              <select value={duration} onChange={e => setDuration(+e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {[30, 45, 60, 90].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field label={
            <div className="flex items-center justify-between">
              <span>{t("t:interviews.chooseDate")}</span>
              <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
                <button onClick={() => setWeekRef(addDays(weekRef, -7))} className="p-0.5 hover:text-foreground"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span className="text-[11px]">{weekLabel}</span>
                <button onClick={() => setWeekRef(addDays(weekRef, 7))} className="p-0.5 hover:text-foreground"><ChevronRight className="w-3.5 h-3.5" /></button>
              </span>
            </div>
          }>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {days.map(d => {
                const iso = toISO(d);
                const past = isPastDate(iso);
                return (
                  <button key={iso} onClick={() => !past && setDateISO(iso)} disabled={past}
                    title={past ? t("t:interviews.pastDateTime") : undefined}
                    className={`text-xs py-2 rounded-md border ${past ? "border-border text-muted-foreground/40 cursor-not-allowed line-through" : dateISO === iso ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-accent"}`}>
                    {labelFor(d)}
                  </button>
                );
              })}
            </div>
            <div className="mt-2">
              <input
                type="date"
                value={dateISO}
                min={todayISO}
                onChange={e => {
                  if (isPastDate(e.target.value)) { toast.error(t("t:interviews.pastDateTime")); return; }
                  setDateISO(e.target.value);
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  setWeekRef(startOfWeek(new Date(y, m - 1, d)));
                }}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </Field>

          <Field label={t("t:interviews.timeSlots")}>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {SLOTS.map(s => {
                const past = isPastSlot(dateISO, s);
                return (
                  <button key={s} onClick={() => !past && setTime(s)} disabled={past}
                    title={past ? t("t:interviews.pastDateTime") : undefined}
                    className={`text-xs py-2 rounded-md border ${past ? "border-border text-muted-foreground/40 cursor-not-allowed line-through" : time === s ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-accent"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            <input
              type="time"
              value={time}
              min={dateISO === todayISO ? nowHM : undefined}
              onChange={e => {
                if (isPastSlot(dateISO, e.target.value)) { toast.error(t("t:interviews.pastDateTime")); return; }
                setTime(e.target.value);
              }}
              className="mt-2 w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            />
          </Field>

          <Field label={t("t:interviews.panel")}>
            <div className="flex flex-wrap gap-1.5">
              {PANEL_POOL.map(p => {
                const on = panel.includes(p);
                return (
                  <button key={p} onClick={() => togglePanel(p)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                    {on ? "✓ " : ""}{p}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/30">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent">{t("t:interviews.cancel")}</button>
          <button onClick={confirm} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md inline-flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> {t("t:interviews.confirmSend")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export default InterviewsPage;
