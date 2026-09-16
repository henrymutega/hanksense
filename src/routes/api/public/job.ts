import { createFileRoute } from "@tanstack/react-router";

const JOB_FIELDS =
  "id,title,department,employment_type,location,work_mode,seniority,openings,summary,responsibilities,required_skills,preferred_skills,education,experience,salary_min,salary_max,salary_currency,benefits,interview_stages,status,session_id,class_id,classes(name,course_code)";

/** Public: read one posted job (no authentication of any kind required). */
export const Route = createFileRoute("/api/public/job")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const jobId = new URL(request.url).searchParams.get("jobId");
        if (!jobId) return Response.json({ error: "Missing jobId" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("session_jobs" as any)
          .select(JOB_FIELDS)
          .eq("id", jobId)
          .maybeSingle();
        if (!row) return Response.json({ job: null });
        const j = row as any;
        return Response.json({
          job: {
            ...j,
            organisation: j.classes
              ? j.classes.course_code
                ? `${j.classes.course_code} · ${j.classes.name}`
                : j.classes.name
              : null,
          },
        });
      },
    },
  },
});
