import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "lecturer" | "student" | "individual";

type AuthState = {
  user: User | null;
  /** The active workspace role. */
  role: AppRole | null;
  /** Every role the account holds (e.g. lecturer + individual). */
  roles: AppRole[];
  loading: boolean;
  refreshRole: () => Promise<void>;
  switchRole: (r: AppRole) => void;
};

const Ctx = createContext<AuthState>({ user: null, role: null, roles: [], loading: true, refreshRole: async () => {}, switchRole: () => {} });

const AUTH_TIMEOUT_MS = 8000;
const ACTIVE_KEY = "hs_active_role";
const PRIORITY: AppRole[] = ["admin", "lecturer", "student", "individual"];

function withTimeout<T>(p: PromiseLike<T>, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), AUTH_TIMEOUT_MS)),
  ]);
}

function pickActive(roles: AppRole[]): AppRole | null {
  if (!roles.length) return null;
  const saved = typeof window !== "undefined" ? (localStorage.getItem(ACTIVE_KEY) as AppRole | null) : null;
  if (saved && roles.includes(saved)) return saved;
  return PRIORITY.find(r => roles.includes(r)) ?? roles[0];
}

export function setPreferredRole(r: AppRole) {
  if (typeof window !== "undefined") localStorage.setItem(ACTIVE_KEY, r);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedFor = useRef<string | null>(null);

  async function loadRole(uid: string | undefined, force = false) {
    if (!uid) { resolvedFor.current = null; setRoles([]); setRole(null); return; }
    if (!force && resolvedFor.current === uid) return;
    resolvedFor.current = uid;
    const { data } = await withTimeout(
      supabase.from("user_roles").select("role").eq("user_id", uid),
      { data: null } as any,
    );
    const list = ((data as any[]) ?? []).map(r => r.role as AppRole);
    setRoles(list);
    setRole(pickActive(list));
  }

  function switchRole(r: AppRole) {
    if (!roles.includes(r)) return;
    setPreferredRole(r);
    setRole(r);
  }

  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };
    const bail = setTimeout(finish, AUTH_TIMEOUT_MS);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setTimeout(() => { loadRole(session?.user?.id).finally(finish); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      loadRole(data.session?.user?.id).finally(finish);
    }).catch(finish);

    return () => { clearTimeout(bail); sub.subscription.unsubscribe(); };
  }, []);

  return (
    <Ctx.Provider value={{ user, role, roles, loading, refreshRole: () => loadRole(user?.id, true), switchRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }

export async function signOut() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.href = "/login";
}
