import { useEffect, useState } from "react";
import { generateCandidates, type Candidate, type Stage } from "./mockData";

let _candidates: Candidate[] = generateCandidates(240);
const listeners = new Set<() => void>();

function emit() { listeners.forEach(l => l()); }

export function getCandidates() { return _candidates; }
export function setCandidates(c: Candidate[]) { _candidates = c; emit(); }

export function updateCandidate(id: string, patch: Partial<Candidate>) {
  _candidates = _candidates.map(c => c.id === id ? { ...c, ...patch } : c);
  emit();
}

export function moveStage(id: string, stage: Stage, note?: string) {
  _candidates = _candidates.map(c => {
    if (c.id !== id) return c;
    if (c.stage === stage) return c;
    const history = [...(c.history || []), { stage, at: Date.now(), note }];
    return { ...c, stage, history };
  });
  emit();
}

export function addCandidates(list: Candidate[]) {
  const stamped = list.map(c => ({
    ...c,
    history: c.history || [{ stage: c.stage, at: Date.now(), note: "Added to pipeline" }],
  }));
  _candidates = [...stamped, ..._candidates];
  emit();
}

export function useCandidates() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(n => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return _candidates;
}
