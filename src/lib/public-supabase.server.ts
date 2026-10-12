import { createClient } from "@supabase/supabase-js";

/**
 * Publishable-key Supabase client for fully public endpoints (job view + apply).
 *
 * Resolution order:
 *  1. Runtime environment variables (Lovable, Node/Vercel with vars configured).
 *  2. Build-time VITE_* values inlined by Vite — these always exist because the
 *     browser client needs them, so public endpoints keep working on hosts
 *     (e.g. Vercel) where only the VITE_* variables were configured at build.
 */
const BUILD_URL = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const BUILD_KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export function publicSupabase() {
  const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;

  const url =
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    BUILD_URL;

  const key =
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    BUILD_KEY;

  if (!url || !key) throw new Error("Supabase URL / publishable key not configured.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
