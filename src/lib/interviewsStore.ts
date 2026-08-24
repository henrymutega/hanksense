import { useEffect, useState } from "react";

export type ScorecardCriterion = {
  label: string;
  score: number; // 1-5
  notes?: string;
};

export type Scorecard = {
  interviewerName: string;
  submittedAt: number;
  criteria: ScorecardCriterion[];
  strengths?: string;
  concerns?: string;
  overall: number; // 1-5
  decision: "Strong Hire" | "Hire" | "No Hire" | "Strong No Hire";
  comments?: string;
};

export type ScheduledInterview = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId?: string;
  jobTitle?: string;
  type: "Phone Screen" | "Technical" | "Panel" | "Final";
  day: string;       // "Mon 19 May" (display label)
  dateISO?: string;  // "2026-06-08" (real calendar date)
  time: string;      // "10:30"
  durationMin: number;
  interviewers: string[];
  meetingUrl: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  emailSent: boolean;
  scorecards: Scorecard[];
  createdAt: number;
};

let _interviews: ScheduledInterview[] = [];
const listeners = new Set<() => void>();

const KEY = "hs.interviews.v1";

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(_interviews)); } catch { /* noop */ }
}
function hydrate() {
  if (typeof window === "undefined") return;
  try { const raw = localStorage.getItem(KEY); if (raw) _interviews = JSON.parse(raw); } catch { /* noop */ }
}
hydrate();

function emit() { listeners.forEach(l => l()); }

export function getInterviews() { return _interviews; }

export function scheduleInterview(
  payload: Omit<ScheduledInterview, "id" | "status" | "emailSent" | "scorecards" | "createdAt" | "meetingUrl"> & { meetingUrl?: string }
): ScheduledInterview {
  const id = `iv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const iv: ScheduledInterview = {
    id,
    status: "Scheduled",
    emailSent: true, // simulated send on creation
    scorecards: [],
    createdAt: Date.now(),
    meetingUrl: payload.meetingUrl || (typeof window !== "undefined" ? `${window.location.origin}/interview-room/${id}` : `/interview-room/${id}`),
    ...payload,
  };
  _interviews = [iv, ..._interviews];
  persist(); emit();
  return iv;
}

export function updateInterview(id: string, patch: Partial<ScheduledInterview>) {
  _interviews = _interviews.map(i => i.id === id ? { ...i, ...patch } : i);
  persist(); emit();
}

export function addScorecard(id: string, card: Scorecard) {
  _interviews = _interviews.map(i =>
    i.id === id
      ? { ...i, scorecards: [...i.scorecards, card], status: "Completed" as const }
      : i
  );
  persist(); emit();
}

export function deleteInterview(id: string) {
  _interviews = _interviews.filter(i => i.id !== id);
  persist(); emit();
}

export function useInterviews() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(n => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return _interviews;
}
