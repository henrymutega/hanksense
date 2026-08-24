import { supabase } from "@/integrations/supabase/client";
import type { Stage } from "@/lib/session-jobs";

/**
 * Update a candidate's stage. If moved to "hired", every other candidate
 * for the same job that hasn't already been hired/rejected/parked is
 * automatically moved to the Talent Pool — preserving their applied job,
 * score, and skills for future roles.
 */
export async function updateCandidateStage(candidateId: string, stage: Stage) {
  const { data: cand, error } = await supabase
    .from("session_candidates" as any)
    .update({ stage })
    .eq("id", candidateId)
    .select("job_id")
    .maybeSingle();
  if (error) throw error;

  if (stage === "hired" && (cand as any)?.job_id) {
    await supabase
      .from("session_candidates" as any)
      .update({ stage: "talent_pool" })
      .eq("job_id", (cand as any).job_id)
      .neq("id", candidateId)
      .not("stage", "in", "(hired,rejected,talent_pool)");
  }
}

/** Mark a candidate withdrawn / declined — sent to talent pool, not hired. */
export async function moveToTalentPool(candidateId: string) {
  await supabase
    .from("session_candidates" as any)
    .update({ stage: "talent_pool" })
    .eq("id", candidateId);
}
