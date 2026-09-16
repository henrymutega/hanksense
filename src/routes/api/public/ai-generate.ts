import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { resolveAiProvider, isAiConfigurationError } from "@/lib/ai-gateway";

/**
 * AI generation proxy.
 *
 * Local development (`bun run dev` on your own machine) has no
 * LOVABLE_API_KEY — that secret only exists on Lovable hosting. The local
 * server forwards generation requests here together with the caller's
 * Supabase access token; we verify the token, then run the generation on
 * Lovable hosting where the managed key is available.
 */
export const Route = createFileRoute("/api/public/ai-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.toLowerCase().startsWith("bearer ")
          ? auth.slice(7).trim()
          : null;
        if (!token) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const parsed = z
          .object({ prompt: z.string().min(3).max(40000) })
          .safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }

        try {
          const { model } = resolveAiProvider(
            process.env.LOVABLE_API_KEY,
            process.env.OPENAI_API_KEY,
          );
          const { text } = await generateText({ model, prompt: parsed.data.prompt });
          return Response.json({ text });
        } catch (e) {
          if (isAiConfigurationError(e)) {
            return Response.json(
              { error: "AI is not configured on the server." },
              { status: 503 },
            );
          }
          const message = e instanceof Error ? e.message : "AI generation failed";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
