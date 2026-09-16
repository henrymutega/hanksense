import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  jobId: z.string(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  cvText: z.string().min(50).max(40000),
  fileName: z.string().max(200).optional().default(""),
});

/** Public: submit a job application. No sign-in required. */
export const Route = createFileRoute("/api/public/apply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid submission." }, { status: 400 });
        const data = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: job } = await supabaseAdmin
          .from("session_jobs" as any)
          .select("id,session_id,class_id,status")
          .eq("id", data.jobId)
          .maybeSingle();
        if (!job) return Response.json({ error: "This job posting no longer exists." }, { status: 404 });
        if ((job as any).status !== "posted")
          return Response.json({ error: "This job posting is closed for applications." }, { status: 400 });

        const email = data.email.toLowerCase();
        const { data: existing } = await supabaseAdmin
          .from("session_candidates" as any)
          .select("id")
          .eq("job_id", data.jobId)
          .eq("email", email)
          .maybeSingle();
        if (existing)
          return Response.json(
            { error: "You have already applied to this job with that email address." },
            { status: 409 },
          );

        const { error } = await supabaseAdmin.from("session_candidates" as any).insert({
          job_id: (job as any).id,
          session_id: (job as any).session_id,
          class_id: (job as any).class_id,
          name: data.name.trim(),
          email,
          cv_text: data.cvText.slice(0, 20000),
          cv_summary: null,
          skills: [],
          score: 0,
          stage: "applied",
        });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
