import React from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function ViewerBanner() {
  const { role, user } = useAuth();
  const [used, setUsed] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!user || role !== "student") return;
    supabase.from("session_jobs").select("id", { count: "exact", head: true }).eq("created_by", user.id).then(({ count }) => setUsed(count ?? 0));
  }, [user?.id, role]);
  if (role !== "student") return null;
  const remaining = used == null ? "…" : Math.max(0, 3 - used);
  return (
    <div className="bg-primary/10 border-b border-primary/30 text-primary text-xs px-6 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="uppercase tracking-widest font-semibold text-[10px] px-1.5 py-0.5 rounded bg-primary/20">Student</span>
      <span>You can create up to 3 job posts per class under your lecturer.</span>
      <span className="ml-auto font-medium">Posts remaining: {remaining}/3</span>
    </div>
  );
}

export function SubscriptionBanner() {
  const { role, user } = useAuth();
  const [state, setState] = React.useState<{ status: string | null; ends: string | null }>({ status: null, ends: null });
  React.useEffect(() => {
    if (!user || role !== "lecturer") return;
    supabase.from("lecturer_billing").select("status, semester_ends_at").eq("lecturer_id", user.id).maybeSingle().then(({ data }) => {
      setState({ status: (data?.status as any) ?? null, ends: data?.semester_ends_at ?? null });
    });
  }, [user?.id, role]);
  if (role !== "lecturer") return null;
  const notExpired = state.ends ? new Date(state.ends).getTime() > Date.now() : false;
  const active = (state.status === "active" || state.status === "trial") && notExpired;
  if (active) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm px-6 py-2 flex items-center justify-between gap-3">
      <div>Your semester subscription is <strong className="uppercase">{state.status || "inactive"}</strong> — ATS write actions are disabled.</div>
      <Link to="/billing" className="text-xs underline font-medium">Renew now →</Link>
    </div>
  );
}
