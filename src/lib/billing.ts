export const ACTIVE_PERIOD_DAYS = 90;
export const TRIAL_PERIOD_DAYS = 7;

export type BillingLike = {
  status?: string | null;
  activated_at?: string | null;
  semester_ends_at?: string | null;
} | null | undefined;

export function periodDays(status?: string | null) {
  return status === "trial" ? TRIAL_PERIOD_DAYS : ACTIVE_PERIOD_DAYS;
}

/** End of the current access period, anchored on the activation date. */
export function accessEnd(b: BillingLike): Date | null {
  if (!b) return null;
  if (b.activated_at) {
    return new Date(new Date(b.activated_at).getTime() + periodDays(b.status) * 86400000);
  }
  return b.semester_ends_at ? new Date(b.semester_ends_at) : null;
}

export function daysLeft(b: BillingLike): number {
  const end = accessEnd(b);
  if (!end) return 0;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

export function accessActive(b: BillingLike): boolean {
  const end = accessEnd(b);
  return (b?.status === "active" || b?.status === "trial") && !!end && end.getTime() > Date.now();
}
