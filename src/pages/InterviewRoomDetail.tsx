import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { VideoRoom } from "@/components/VideoRoom";
import { useInterviews, addScorecard, updateInterview, type Scorecard } from "@/lib/interviewsStore";
import { useCandidates, moveStage } from "@/lib/store";
import { Video, Sparkles, ClipboardCheck, ArrowLeft, Mail, Clock, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";




const DEFAULT_CRITERIA = [
  "Technical proficiency",
  "Problem solving",
  "Communication",
  "Culture / values fit",
  "Role-specific experience",
];

const DECISIONS: Scorecard["decision"][] = ["Strong Hire", "Hire", "No Hire", "Strong No Hire"];

function InterviewRoom() {
  const { t } = useTranslation();
  const { id } = useParams({ from: "/interview-room/$id" });
  const interviews = useInterviews();
  const candidates = useCandidates();
  const iv = interviews.find(x => x.id === id);

  if (!iv) {
    return (
      <div className="p-8">
        <p>{t("interviewRoom.notFound")}</p>
        <Link to="/interviews" className="text-primary text-sm">{t("interviewRoom.back")}</Link>
      </div>
    );
  }

  const candidate = candidates.find(c => c.id === iv.candidateId);
  const statusLabel = iv.status === "Completed" ? t("interviews.statusCompleted") :
    iv.status === "In Progress" ? t("interviews.statusInProgress") :
    iv.status === "Cancelled" ? t("interviews.statusCancelled") : t("interviews.statusScheduled");

  return (
    <div>
      <Link to="/interviews" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="w-4 h-4" /> {t("interviewRoom.back")}
      </Link>

      <PageHeader
        title={t("interviewRoom.liveInterview", { name: iv.candidateName })}
        subtitle={t("interviewRoom.subtitle", { type: iv.type, day: iv.day, time: iv.time, min: iv.durationMin, id: iv.id })}
        actions={
          <span className={`text-xs px-2.5 py-1 rounded-full ${
            iv.status === "Completed" ? "bg-[color:var(--success)]/10 text-[color:var(--success)]" :
            iv.status === "In Progress" ? "bg-primary/10 text-primary" :
            "bg-accent text-accent-foreground"
          }`}>{statusLabel}</span>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: video + transcript */}
        <div className="lg:col-span-2 space-y-6">
          <VideoRoom
            roomId={iv.id}
            displayName="Dr. Recruiter"
            remoteLabel={iv.candidateName}
            recording={iv.status === "In Progress"}
            onJoined={() => {
              if (iv.status === "Scheduled") updateInterview(iv.id, { status: "In Progress" });
            }}
            onLeft={() => {
              toast("Call ended — submit your scorecard below");
            }}
          />

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Live transcript & AI insights</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-3 text-xs h-56 overflow-auto space-y-2 font-mono">
                <div><span className="text-primary">Interviewer:</span> Walk me through your most complex project.</div>
                <div><span className="text-[color:var(--success)]">{iv.candidateName.split(" ")[0]}:</span> I led the redesign of...</div>
                <div><span className="text-primary">Interviewer:</span> How did you handle disagreement on the team?</div>
                <div><span className="text-[color:var(--success)]">{iv.candidateName.split(" ")[0]}:</span> I scheduled a working session and...</div>
                <div className="text-muted-foreground italic">— transcribing in real time —</div>
              </div>
              <ul className="text-xs space-y-1.5">
                <li>• Communication clarity: <span className="text-[color:var(--success)] font-medium">High</span></li>
                <li>• Technical depth: <span className="text-[color:var(--success)] font-medium">Strong</span></li>
                <li>• Confidence signals: <span className="text-[color:var(--warning)] font-medium">Moderate</span></li>
                <li>• Sentiment: <span className="text-[color:var(--success)] font-medium">Positive</span></li>
                <li>• Suggested follow-up: <span className="text-primary font-medium">System design probe</span></li>
                <li>• Talking ratio (cand/interviewer): <span className="font-mono">62 / 38</span></li>
              </ul>
            </div>
          </div>

          <ScorecardForm iv={iv} />
        </div>

        {/* Right: side panel */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3 text-sm">Candidate</h3>
            {candidate ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full grid place-items-center text-sm font-semibold text-white" style={{ background: candidate.avatarColor }}>
                    {candidate.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{candidate.name}</div>
                    <div className="text-xs text-muted-foreground">Score {candidate.score} · {candidate.yearsExp} yrs</div>
                  </div>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{candidate.email}</div>
                  <div>{candidate.role} · {candidate.location}</div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {candidate.skills.slice(0, 6).map(s => <span key={s} className="text-[10px] bg-secondary text-secondary-foreground rounded px-1.5 py-0.5">{s}</span>)}
                </div>
                <Link to="/candidates/$id" params={{ id: candidate.id }} className="text-xs text-primary hover:underline mt-3 inline-block">View full profile →</Link>
              </>
            ) : <p className="text-xs text-muted-foreground">Candidate record not found.</p>}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3 text-sm">Interview details</h3>
            <ul className="text-xs space-y-2">
              <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{iv.day} at {iv.time}</li>
              <li className="flex items-center gap-2"><Video className="w-3.5 h-3.5 text-muted-foreground" /><a href={iv.meetingUrl} className="text-primary hover:underline truncate">{iv.meetingUrl}</a></li>
              <li className="flex items-start gap-2"><Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5" /><span>{iv.interviewers.join(", ")}</span></li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" />Invite {iv.emailSent ? <span className="text-[color:var(--success)]">sent</span> : "pending"}</li>
            </ul>
          </div>

          {iv.scorecards.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /> Submitted scorecards ({iv.scorecards.length})</h3>
              <ul className="space-y-3">
                {iv.scorecards.map((s, i) => (
                  <li key={i} className="border border-border rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{s.interviewerName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        s.decision.includes("Strong Hire") ? "bg-[color:var(--success)]/10 text-[color:var(--success)]" :
                        s.decision === "Hire" ? "bg-primary/10 text-primary" :
                        "bg-destructive/10 text-destructive"
                      }`}>{s.decision}</span>
                    </div>
                    <div className="text-muted-foreground">Overall: <span className="font-mono text-foreground">{s.overall}/5</span></div>
                    {s.comments && <div className="text-muted-foreground italic mt-1">"{s.comments}"</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ScorecardForm({ iv }: { iv: ReturnType<typeof useInterviews>[number] }) {
  const [interviewerName, setInterviewerName] = useState("Dr. Recruiter");
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_CRITERIA.map(c => [c, 3]))
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<Scorecard["decision"]>("Hire");

  const overall = useMemo(() => {
    const vals = Object.values(scores);
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }, [scores]);

  function submit() {
    const card: Scorecard = {
      interviewerName,
      submittedAt: Date.now(),
      criteria: DEFAULT_CRITERIA.map(c => ({ label: c, score: scores[c], notes: notes[c] })),
      strengths,
      concerns,
      overall,
      decision,
      comments,
    };
    addScorecard(iv.id, card);

    // Auto-progress candidate based on decision
    if (decision === "Strong Hire" || decision === "Hire") {
      if (iv.type === "Final") {
        moveStage(iv.candidateId, "Offer", `Scorecard: ${decision} (${overall}/5)`);
        toast.success("Scorecard saved — candidate advanced to Offer stage");
      } else {
        moveStage(iv.candidateId, "Final Interview", `Scorecard: ${decision} (${overall}/5)`);
        toast.success("Scorecard saved — candidate advanced to Final Interview");
      }
    } else {
      moveStage(iv.candidateId, "Rejected", `Scorecard: ${decision} (${overall}/5)`);
      toast(`Scorecard saved — candidate marked as ${decision}`);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /> Scorecard & decision</h3>
        <div className="text-xs text-muted-foreground">Overall: <span className="font-mono font-semibold text-foreground text-base">{overall}/5</span></div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium block mb-1">Interviewer</label>
        <input value={interviewerName} onChange={e => setInterviewerName(e.target.value)}
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
      </div>

      <div className="space-y-3 mb-4">
        {DEFAULT_CRITERIA.map(c => (
          <div key={c} className="border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">{c}</span>
              <span className="font-mono text-sm">{scores[c]}/5</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setScores(s => ({ ...s, [c]: n }))}
                  className={`flex-1 h-8 rounded text-xs font-medium ${
                    scores[c] === n ? "bg-primary text-primary-foreground" :
                    scores[c] >= n ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground hover:bg-accent"
                  }`}>{n}</button>
              ))}
            </div>
            <input
              value={notes[c] || ""}
              onChange={e => setNotes(n => ({ ...n, [c]: e.target.value }))}
              placeholder="Notes / evidence..."
              className="w-full bg-background border border-border rounded text-xs px-2 py-1.5"
            />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium block mb-1">Strengths observed</label>
          <textarea value={strengths} onChange={e => setStrengths(e.target.value)} rows={3}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="What stood out..." />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Concerns / gaps</label>
          <textarea value={concerns} onChange={e => setConcerns(e.target.value)} rows={3}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="What's missing..." />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium block mb-1">Overall comments to hiring team</label>
        <textarea value={comments} onChange={e => setComments(e.target.value)} rows={2}
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium block mb-2">Hiring decision</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DECISIONS.map(d => (
            <button key={d} onClick={() => setDecision(d)}
              className={`text-xs py-2.5 rounded-md border font-medium ${
                decision === d
                  ? d.includes("Strong Hire") ? "border-[color:var(--success)] bg-[color:var(--success)]/10 text-[color:var(--success)]"
                    : d === "Hire" ? "border-primary bg-primary/10 text-primary"
                    : "border-destructive bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}>
              {decision === d && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{d}
            </button>
          ))}
        </div>
      </div>

      <button onClick={submit} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium">
        Submit scorecard & advance candidate
      </button>
    </div>
  );
}

export default InterviewRoom;
