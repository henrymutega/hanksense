import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type LecturerState = {
  loading: boolean;
  accountStatus: "pending" | "approved" | "suspended" | null;
  billingStatus: "active" | "trial" | "inactive" | "expired" | null;
  semesterEndsAt: string | null;
  /** User can perform write actions (approved + active/trial + not past end for lecturers; always for admins; students within quota). */
  canWrite: boolean;
  /** Convenience flag: current role is student. */
  isStudent: boolean;
};

export function useLecturerState(): LecturerState {
  const { user, role } = useAuth();
  const [s, setS] = useState<LecturerState>({ loading: true, accountStatus: null, billingStatus: null, semesterEndsAt: null, canWrite: false, isStudent: false });

  useEffect(() => {
    if (!user) { setS(x => ({ ...x, loading: false })); return; }
    if (role === "student") {
      setS({ loading: false, accountStatus: null, billingStatus: null, semesterEndsAt: null, canWrite: true, isStudent: true });
      return;
    }
    if (role !== "lecturer" && role !== "admin") {
      setS({ loading: false, accountStatus: null, billingStatus: null, semesterEndsAt: null, canWrite: role === "admin", isStudent: false });
      return;
    }
    (async () => {
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase.from("profiles").select("account_status").eq("id", user.id).maybeSingle(),
        supabase.from("lecturer_billing").select("status, semester_ends_at").eq("lecturer_id", user.id).maybeSingle(),
      ]);
      const accountStatus = (p?.account_status as any) ?? null;
      const billingStatus = (b?.status as any) ?? null;
      const ends = b?.semester_ends_at ?? null;
      const notExpired = ends ? new Date(ends).getTime() > Date.now() : false;
      const canWrite = role === "admin" || (accountStatus === "approved" && (billingStatus === "active" || billingStatus === "trial") && notExpired);
      setS({ loading: false, accountStatus, billingStatus, semesterEndsAt: ends, canWrite, isStudent: false });
    })();
  }, [user?.id, role]);

  return s;
}

export const STUDENT_JOB_LIMIT = 3;

/**
 * Live counter of session_jobs authored by the current student.
 * The quota is per lecturer: pass the lecturer id of the class being used.
 * Without a lecturer id it counts all of the student's posts (informational).
 */
export function useStudentJobUsage(lecturerId?: string | null) {
  const { user, role } = useAuth();
  const [state, setState] = useState<{ used: number; limit: number; remaining: number; loading: boolean }>({ used: 0, limit: STUDENT_JOB_LIMIT, remaining: STUDENT_JOB_LIMIT, loading: true });
  useEffect(() => {
    if (!user || role !== "student") { setState({ used: 0, limit: STUDENT_JOB_LIMIT, remaining: STUDENT_JOB_LIMIT, loading: false }); return; }
    (async () => {
      let q = supabase.from("session_jobs").select("id", { count: "exact", head: true }).eq("created_by", user.id);
      if (lecturerId) q = q.eq("lecturer_id", lecturerId);
      const { count } = await q;
      const used = count ?? 0;
      setState({ used, limit: STUDENT_JOB_LIMIT, remaining: Math.max(0, STUDENT_JOB_LIMIT - used), loading: false });
    })();
  }, [user?.id, role, lecturerId]);
  return state;
}
