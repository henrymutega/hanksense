import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicJob = {
  id: string;
  title: string;
  department: string | null;
  employment_type: string | null;
  location: string | null;
  work_mode: string | null;
  seniority: string | null;
  openings: number;
  summary: string | null;
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  education: string | null;
  experience: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  benefits: string[];
  interview_stages: string[];
  status: string;
  organisation: string | null;
};

const JOB_FIELDS =
  "id,title,department,employment_type,location,work_mode,seniority,openings,summary,responsibilities,required_skills,preferred_skills,education,experience,salary_min,salary_max,salary_currency,benefits,interview_stages,status,session_id,class_id,classes(name,course_code)";

/** Public: read one posted job so anyone with the link can view and apply. */
export const getPublicJob = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ jobId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<PublicJob | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("session_jobs" as any)
      .select(JOB_FIELDS)
      .eq("id", data.jobId)
      .maybeSingle();
    if (!row) return null;
    const j = row as any;
    return {
      ...j,
      organisation: j.classes ? (j.classes.course_code ? `${j.classes.course_code} · ${j.classes.name}` : j.classes.name) : null,
    } as PublicJob;
  });

/** Public: submit an application (CV text extracted in the browser). */
export const submitApplication = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        jobId: z.string(),
        name: z.string().min(2).max(120),
        email: z.string().email(),
        cvText: z.string().min(50).max(40000),
        fileName: z.string().max(200).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job } = await supabaseAdmin
      .from("session_jobs" as any)
      .select("id,session_id,class_id,status")
      .eq("id", data.jobId)
      .maybeSingle();
    if (!job) throw new Error("This job posting no longer exists.");
    if ((job as any).status !== "posted") throw new Error("This job posting is closed for applications.");

    const { data: existing } = await supabaseAdmin
      .from("session_candidates" as any)
      .select("id")
      .eq("job_id", data.jobId)
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (existing) throw new Error("You have already applied to this job with that email address.");

    const { error } = await supabaseAdmin.from("session_candidates" as any).insert({
      job_id: (job as any).id,
      session_id: (job as any).session_id,
      class_id: (job as any).class_id,
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      cv_text: data.cvText.slice(0, 20000),
      cv_summary: null,
      skills: [],
      score: 0,
      stage: "applied",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
