import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  jobId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  cvText: z.string().min(50),
  fileName: z.string().max(200).optional().default(""),
});

export const Route = createFileRoute("/api/public/apply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json().catch(() => null);
          const parsed = Body.safeParse(raw);
          if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return Response.json(
              { error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid submission." },
              { status: 400 },
            );
          }
          const data = parsed.data;
          const cvText = data.cvText.replace(/\s+/g, " ").trim().slice(0, 20000);

          const { publicSupabase } = await import("@/lib/public-supabase.server");
          const { data: result, error } = await publicSupabase().rpc("apply_to_job" as any, {
            _job_id: data.jobId,
            _name: data.name.trim(),
            _email: data.email.toLowerCase().trim(),
            _cv_text: cvText,
          });
          if (error) return Response.json({ error: error.message }, { status: 400 });
          const r = result as any;
          if (!r?.ok) return Response.json({ error: r?.error || "Submission failed." }, { status: 400 });
          return Response.json({ ok: true });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Submission failed." },
            { status: 400 },
          );
        }
      },
    },
  },
});
