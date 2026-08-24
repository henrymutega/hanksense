import { useEffect, useState } from "react";
import type { AIJob } from "./ai-jobs.functions";

export type PostedJob = AIJob & {
  id: string;
  status: "Draft" | "Posted" | "Closed";
  createdAt: number;
};

let _jobs: PostedJob[] = [];
let _activeJobId: string | null = null;
const listeners = new Set<() => void>();

const KEY = "hs.postedJobs.v2";
const ACTIVE_KEY = "hs.activeJobId.v2";

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(_jobs));
    if (_activeJobId) localStorage.setItem(ACTIVE_KEY, _activeJobId);
  } catch { /* noop */ }
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) _jobs = JSON.parse(raw);
    const a = localStorage.getItem(ACTIVE_KEY);
    if (a) _activeJobId = a;
  } catch { /* noop */ }
}
hydrate();

function emit() { listeners.forEach(l => l()); }

export function getJobs() { return _jobs; }
export function getActiveJob() {
  return _jobs.find(j => j.id === _activeJobId) || _jobs[0] || null;
}
export function setActiveJob(id: string) {
  _activeJobId = id; persist(); emit();
}
export function postJob(job: AIJob): PostedJob {
  const posted: PostedJob = {
    ...job,
    id: `job-${Date.now().toString(36)}`,
    status: "Posted",
    createdAt: Date.now(),
  };
  _jobs = [posted, ..._jobs];
  _activeJobId = posted.id;
  persist(); emit();
  return posted;
}
export function updateJobStatus(id: string, status: PostedJob["status"]) {
  _jobs = _jobs.map(j => j.id === id ? { ...j, status } : j);
  persist(); emit();
}
export function deleteJob(id: string) {
  _jobs = _jobs.filter(j => j.id !== id);
  if (_activeJobId === id) _activeJobId = _jobs[0]?.id || null;
  persist(); emit();
}

export function usePostedJobs() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(n => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { jobs: _jobs, activeJob: getActiveJob(), activeJobId: _activeJobId };
}
