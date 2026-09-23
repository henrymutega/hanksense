import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { accessEnd } from "@/lib/billing";


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
        supabase.from("lecturer_billing").select("status, semester_ends_at, activated_at").eq("lecturer_id", user.id).maybeSingle(),
      ]);
      const accountStatus = (p?.account_status as any) ?? null;
      const billingStatus = (b?.status as any) ?? null;
      // The access window is anchored on the activation date (7d trial / 90d active).
      const endDate = accessEnd(b as any);
      const ends = endDate ? endDate.toISOString() : null;

      const notExpired = ends ? new Date(ends).getTime() > Date.now() : false;

      const canWrite = role === "admin" || (accountStatus === "approved" && (billingStatus === "active" || billingStatus === "trial") && notExpired);
      setS({ loading: false, accountStatus, billingStatus, semesterEndsAt: ends, canWrite, isStudent: false });
    })();
  }, [user?.id, role]);

  return s;
}

export const STUDENT_JOB_LIMIT = 3;
/** Posts unlocked per paid top-up, and its price in CNY. */
export const TOPUP_SLOTS = 3;
export const TOPUP_PRICE_CNY = 20;

export type TopupStatus = "pending" | "approved" | "declined";

export type StudentJobUsage = {
  used: number;
  /** Base limit plus purchased extra slots. */
  limit: number;
  extra: number;
  remaining: number;
  loading: boolean;
  /** Status of the student's most recent top-up request for this lecturer. */
  requestStatus: TopupStatus | null;
  refresh: () => void;
};

/**
 * Live counter of session_jobs authored by the current student.
 * The quota is per lecturer: pass the lecturer id of the class being used.
 * Without a lecturer id it counts all of the student's posts (informational).
 */
export function useStudentJobUsage(lecturerId?: string | null): StudentJobUsage {
  const { user, role } = useAuth();
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<Omit<StudentJobUsage, "refresh">>({
    used: 0, limit: STUDENT_JOB_LIMIT, extra: 0, remaining: STUDENT_JOB_LIMIT, loading: true, requestStatus: null,
  });
  useEffect(() => {
    if (!user || role !== "student") {
      setState({ used: 0, limit: STUDENT_JOB_LIMIT, extra: 0, remaining: STUDENT_JOB_LIMIT, loading: false, requestStatus: null });
      return;
    }
    (async () => {
      let q = supabase.from("session_jobs").select("id", { count: "exact", head: true }).eq("created_by", user.id);
      if (lecturerId) q = q.eq("lecturer_id", lecturerId);
      const { count } = await q;
      const used = count ?? 0;

      let extra = 0;
      let requestStatus: TopupStatus | null = null;
      if (lecturerId) {
        const [{ data: credit }, { data: req }] = await Promise.all([
          supabase.from("student_job_credits").select("extra_slots")
            .eq("student_id", user.id).eq("lecturer_id", lecturerId).maybeSingle(),
          supabase.from("student_topup_requests").select("status")
            .eq("student_id", user.id).eq("lecturer_id", lecturerId)
            .order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        extra = credit?.extra_slots ?? 0;
        requestStatus = (req?.status as TopupStatus) ?? null;
      }
      const limit = STUDENT_JOB_LIMIT + extra;
      setState({ used, limit, extra, remaining: Math.max(0, limit - used), loading: false, requestStatus });
    })();
  }, [user?.id, role, lecturerId, tick]);
  return { ...state, refresh: () => setTick(x => x + 1) };
}
