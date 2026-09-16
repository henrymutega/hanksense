import { supabase } from "@/integrations/supabase/client";

export type OnboardingTask = {
  key: string;
  day: number; // offset from start date (negative = pre-boarding)
  title: string;
  owner: "HR" | "IT" | "Manager" | "Buddy" | "Hire";
  category: "Paperwork" | "Equipment" | "People" | "Training" | "Goals";
};

export type OnboardingPlan = {
  candidate_id: string;
  start_date: string;
  manager: string | null;
  buddy: string | null;
  notes: string | null;
};

export type TaskState = { task_key: string; done: boolean; completed_at: string | null };

/** Day-by-day plan mirroring a real organisation's first 90 days. */
export const ONBOARDING_TASKS: OnboardingTask[] = [
  { key: "pre_contract", day: -7, title: "Signed contract returned", owner: "HR", category: "Paperwork" },
  { key: "pre_id_tax", day: -7, title: "ID, tax and bank details collected", owner: "HR", category: "Paperwork" },
  { key: "pre_bgcheck", day: -5, title: "Background & reference checks cleared", owner: "HR", category: "Paperwork" },
  { key: "pre_accounts", day: -3, title: "Email, SSO and system accounts created", owner: "IT", category: "Equipment" },
  { key: "pre_laptop", day: -2, title: "Laptop and access badge shipped", owner: "IT", category: "Equipment" },
  { key: "pre_welcome", day: -1, title: "Welcome email with day-1 agenda sent", owner: "HR", category: "People" },

  { key: "d1_welcome", day: 1, title: "Welcome & office/remote tour", owner: "HR", category: "People" },
  { key: "d1_setup", day: 1, title: "Device setup and tool access verified", owner: "IT", category: "Equipment" },
  { key: "d1_manager", day: 1, title: "First 1:1 with hiring manager", owner: "Manager", category: "People" },
  { key: "d1_buddy", day: 1, title: "Introduced to onboarding buddy", owner: "Buddy", category: "People" },

  { key: "d2_handbook", day: 2, title: "Handbook, policies and code of conduct", owner: "HR", category: "Training" },
  { key: "d2_security", day: 2, title: "Security & data-protection training", owner: "IT", category: "Training" },
  { key: "d3_team", day: 3, title: "Team introductions and rituals", owner: "Manager", category: "People" },
  { key: "d3_tools", day: 3, title: "Role tooling walkthrough", owner: "Buddy", category: "Training" },

  { key: "w1_shadow", day: 5, title: "Shadow a teammate on live work", owner: "Buddy", category: "Training" },
  { key: "w1_goals", day: 5, title: "30-60-90 goals agreed with manager", owner: "Manager", category: "Goals" },
  { key: "w1_checkin", day: 7, title: "End of week 1 check-in", owner: "HR", category: "People" },

  { key: "w2_task", day: 10, title: "First owned task delivered", owner: "Hire", category: "Goals" },
  { key: "w2_stakeholders", day: 12, title: "Meet cross-functional stakeholders", owner: "Manager", category: "People" },
  { key: "w3_compliance", day: 15, title: "Compliance modules completed", owner: "Hire", category: "Training" },

  { key: "d30_review", day: 30, title: "30-day review — ramp-up on track", owner: "Manager", category: "Goals" },
  { key: "d30_feedback", day: 30, title: "New-hire onboarding feedback survey", owner: "HR", category: "People" },
  { key: "d60_ownership", day: 60, title: "60-day review — full ownership of scope", owner: "Manager", category: "Goals" },
  { key: "d90_probation", day: 90, title: "90-day probation decision & confirmation", owner: "HR", category: "Goals" },
];

export const PHASES: { key: string; label: string; from: number; to: number }[] = [
  { key: "pre", label: "Pre-boarding", from: -99, to: 0 },
  { key: "week1", label: "Week 1", from: 1, to: 7 },
  { key: "month1", label: "Weeks 2–4", from: 8, to: 29 },
  { key: "d30", label: "30 days", from: 30, to: 59 },
  { key: "d60", label: "60 days", from: 60, to: 89 },
  { key: "d90", label: "90 days", from: 90, to: 999 },
];

export function taskDate(startDate: string, day: number) {
  const d = new Date(`${startDate}T00:00:00`);
  d.setDate(d.getDate() + (day > 0 ? day - 1 : day));
  return d;
}

export function dayIndex(startDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const today = new Date(new Date().toDateString()).getTime();
  const diff = Math.round((today - start) / 86400000);
  return diff >= 0 ? diff + 1 : diff; // day 1 = start date
}

export async function loadPlan(candidateId: string): Promise<OnboardingPlan | null> {
  const { data } = await supabase
    .from("onboarding_plans" as any)
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return (data as any) || null;
}

export async function ensurePlan(candidateId: string, startDate?: string): Promise<OnboardingPlan> {
  const existing = await loadPlan(candidateId);
  if (existing) return existing;
  const start = startDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("onboarding_plans" as any)
    .insert({ candidate_id: candidateId, start_date: start } as any)
    .select("*")
    .maybeSingle();
  return (data as any) || { candidate_id: candidateId, start_date: start, manager: null, buddy: null, notes: null };
}

export async function savePlan(candidateId: string, patch: Partial<OnboardingPlan>) {
  await supabase.from("onboarding_plans" as any).update(patch as any).eq("candidate_id", candidateId);
}

export async function loadTaskStates(candidateId: string): Promise<Record<string, TaskState>> {
  const { data } = await supabase
    .from("onboarding_task_state" as any)
    .select("task_key, done, completed_at")
    .eq("candidate_id", candidateId);
  const map: Record<string, TaskState> = {};
  ((data as any[]) || []).forEach(r => { map[r.task_key] = r; });
  return map;
}

export async function setTaskDone(candidateId: string, taskKey: string, done: boolean) {
  await supabase
    .from("onboarding_task_state" as any)
    .upsert(
      { candidate_id: candidateId, task_key: taskKey, done, completed_at: done ? new Date().toISOString() : null } as any,
      { onConflict: "candidate_id,task_key" } as any,
    );
}
