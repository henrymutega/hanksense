import React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { FadeTransition } from "@/components/LogoLoader";

const CHECK_TIMEOUT_MS = 8000;

/** Resolve a check even if the network call stalls, so the app never hangs. */
function withTimeout<T>(p: PromiseLike<T>, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), CHECK_TIMEOUT_MS)),
  ]);
}

/** Lecturers whose account is pending/suspended are parked on /pending. */
export function PendingGate({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const nav = useNavigate();
  const [check, setCheck] = React.useState<"loading" | "ok" | "blocked">("loading");

  // Query once per user, not on every navigation.
  React.useEffect(() => {
    let cancelled = false;
    if (!user || role !== "lecturer") { setCheck("ok"); return; }
    setCheck("loading");
    (async () => {
      const { data } = await withTimeout(
        supabase.from("profiles").select("account_status").eq("id", user.id).maybeSingle(),
        { data: null } as any,
      );
      if (cancelled) return;
      const s = data?.account_status;
      setCheck(s === "pending" || s === "suspended" ? "blocked" : "ok");
    })();
    return () => { cancelled = true; };
  }, [user?.id, role]);

  React.useEffect(() => {
    if (check === "blocked" && path !== "/pending") nav({ to: "/pending" });
    if (check === "ok" && path === "/pending") nav({ to: "/" });
  }, [check, path]);

  return <FadeTransition loading={check === "loading"}>{children}</FadeTransition>;
}

/** Students must always belong to a lecturer via a class/session. */
export function StudentAttachmentGate({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const nav = useNavigate();
  const [state, setState] = React.useState<"loading" | "ok" | "orphan">("loading");

  React.useEffect(() => {
    let cancelled = false;
    if (!user || role !== "student") { setState("ok"); return; }
    setState("loading");
    (async () => {
      const { count } = await withTimeout(
        supabase
          .from("class_memberships")
          .select("class_id", { count: "exact", head: true })
          .eq("student_id", user.id),
        { count: 0 } as any,
      );
      if (cancelled) return;
      setState((count ?? 0) > 0 ? "ok" : "orphan");
    })();
    return () => { cancelled = true; };
  }, [user?.id, role]);

  React.useEffect(() => {
    if (state === "ok" && path === "/join-session") nav({ to: "/" });
    if (state === "orphan" && path !== "/join-session") nav({ to: "/join-session" });
  }, [state, path]);

  return <FadeTransition loading={state === "loading"}>{children}</FadeTransition>;
}
