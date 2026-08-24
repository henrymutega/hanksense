import React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/** Lecturers whose account is pending/suspended are parked on /pending. */
export function PendingGate({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const nav = useNavigate();
  const [check, setCheck] = React.useState<"loading" | "ok" | "blocked">("loading");
  React.useEffect(() => {
    if (!user || role !== "lecturer") { setCheck("ok"); return; }
    (async () => {
      const { data } = await supabase.from("profiles").select("account_status").eq("id", user.id).maybeSingle();
      const s = data?.account_status;
      if (s === "pending" || s === "suspended") {
        setCheck("blocked");
        if (path !== "/pending") nav({ to: "/pending" });
      } else {
        setCheck("ok");
        if (path === "/pending") nav({ to: "/" });
      }
    })();
  }, [user?.id, role, path]);
  if (check === "loading") return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  return <>{children}</>;
}

/** Students must always belong to a lecturer via a class/session. */
export function StudentAttachmentGate({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const nav = useNavigate();
  const [state, setState] = React.useState<"loading" | "ok" | "orphan">("loading");
  React.useEffect(() => {
    if (!user || role !== "student") { setState("ok"); return; }
    (async () => {
      const { count } = await supabase
        .from("class_memberships")
        .select("class_id", { count: "exact", head: true })
        .eq("student_id", user.id);
      if ((count ?? 0) > 0) {
        setState("ok");
        if (path === "/join-session") nav({ to: "/" });
      } else {
        setState("orphan");
        if (path !== "/join-session") nav({ to: "/join-session" });
      }
    })();
  }, [user?.id, role, path]);
  if (state === "loading") return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  return <>{children}</>;
}
