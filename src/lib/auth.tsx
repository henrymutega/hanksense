import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "lecturer" | "student";

type AuthState = {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
};

const Ctx = createContext<AuthState>({ user: null, role: null, loading: true, refreshRole: async () => {} });

/** Never let a slow/failed network call keep the app on the splash screen. */
const AUTH_TIMEOUT_MS = 8000;

function withTimeout<T>(p: PromiseLike<T>, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), AUTH_TIMEOUT_MS)),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedFor = useRef<string | null>(null);

  async function loadRole(uid: string | undefined, force = false) {
    if (!uid) { resolvedFor.current = null; setRole(null); return; }
    if (!force && resolvedFor.current === uid) return;
    resolvedFor.current = uid;
    const { data } = await withTimeout(
      supabase.from("user_roles").select("role").eq("user_id", uid).limit(1).maybeSingle(),
      { data: null } as any,
    );
    setRole((data?.role as AppRole) ?? null);
  }

  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };
    // Hard stop: whatever happens, stop showing the splash after the timeout.
    const bail = setTimeout(finish, AUTH_TIMEOUT_MS);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      // defer to avoid deadlock
      setTimeout(() => { loadRole(session?.user?.id).finally(finish); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      loadRole(data.session?.user?.id).finally(finish);
    }).catch(finish);

    return () => { clearTimeout(bail); sub.subscription.unsubscribe(); };
  }, []);

  return (
    <Ctx.Provider value={{ user, role, loading, refreshRole: () => loadRole(user?.id, true) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }

export async function signOut() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.href = "/login";
}
