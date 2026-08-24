import React, { useEffect } from "react";
import { useRouterState, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { PendingGate, StudentAttachmentGate } from "./Gates";
import { ViewerBanner, SubscriptionBanner } from "./Banners";

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password"];
export function isPublic(p: string) {
  return PUBLIC_PATHS.includes(p) || p.startsWith("/join/");
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, role, loading, refreshRole } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const nav = useNavigate();
  const qc = useQueryClient();
  const router = useRouter();

  // post-OAuth: apply pending role/invite stored before redirect
  useEffect(() => {
    if (!user) return;
    (async () => {
      const pendingRole = sessionStorage.getItem("pending_role");
      const pendingInvite = sessionStorage.getItem("pending_invite");
      if (pendingRole) {
        await supabase.rpc("assign_self_role", { _role: pendingRole as any });
        sessionStorage.removeItem("pending_role");
      }
      if (pendingInvite) {
        const { error } = await supabase.rpc("redeem_session_code", { _code: pendingInvite });
        if (error) await supabase.rpc("redeem_class_invite", { _code: pendingInvite });
        sessionStorage.removeItem("pending_invite");
      }
      if (pendingRole || pendingInvite) await refreshRole();
    })();
  }, [user?.id]);

  // invalidate caches on auth change
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      router.invalidate(); qc.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, qc]);

  // redirect logic — compute a single target and only navigate when it differs
  const lastTarget = React.useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    let target: string | null = null;
    if (!user && !isPublic(path) && path !== "/") target = "/login";
    else if (user && (path === "/login" || path === "/signup")) target = "/";
    else if (user && !role && path !== "/select-role" && !isPublic(path)) target = "/select-role";
    else if (user && role && path === "/select-role") target = "/";

    if (!target || target === path) { lastTarget.current = null; return; }
    if (lastTarget.current === target) return;
    lastTarget.current = target;
    nav({ to: target });
  }, [user?.id, role, loading, path]);

  if (isPublic(path)) return <>{children}</>;
  if (!loading && !user && path === "/") return <>{children}</>;
  if (loading || !user) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (path === "/select-role" || path === "/pending" || path === "/join-session") return <>{children}</>;

  return (
    <PendingGate>
      <StudentAttachmentGate>
        <div className="flex min-h-screen bg-background">
          <AppSidebar />
          <main className="flex-1 min-w-0 pt-14 md:pt-0">
            <ViewerBanner />
            <SubscriptionBanner />
            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8">{children}</div>
          </main>
        </div>
      </StudentAttachmentGate>
    </PendingGate>
  );
}
