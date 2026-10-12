import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateValidated } from "./ai-jobs.functions";

const langName = (l?: string) => (l === "zh" ? "Simplified Chinese (简体中文)" : "English");

const AnalysisSchema = z.object({
  jobTitle: z.string().default(""),
  company: z.string().default(""),
  summary: z.string().default(""),
  keyResponsibilities: z.array(z.string()).default([]),
  mustHaveSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
  experience: z.string().default(""),
  education: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  cvTips: z.array(z.string()).default([]),
});
export type JobAnalysis = z.infer<typeof AnalysisSchema>;

const MatchSchema = z.object({
  score: z.coerce.number().default(0),
  verdict: z.string().default(""),
  whatYouHave: z.array(z.string()).default([]),
  whatIsMissing: z.array(z.string()).default([]),
  whatToAdd: z.array(z.string()).default([]),
  keywordsMissing: z.array(z.string()).default([]),
});
export type CvMatch = z.infer<typeof MatchSchema>;

const TailorSchema = z.object({ cv: z.string().default("") });

export const analyzeJobDescription = createServerFn({ method: "POST" })
  .validator((i: { jd: string; language?: string }) =>
    z.object({ jd: z.string().min(30).max(20000), language: z.string().max(10).optional() }).parse(i))
  .handler(async ({ data }) => {
    const prompt = `You are a senior career coach. Analyse the job description below and extract what a candidate must show in their CV.
Write all text in ${langName(data.language)}.
Return STRICT JSON:
{"jobTitle":"","company":"","summary":"2-3 sentences","keyResponsibilities":["5-8 items"],"mustHaveSkills":["6-12"],"niceToHaveSkills":["3-8"],"experience":"years/type of experience required","education":"","keywords":["8-15 ATS keywords"],"cvTips":["4-6 concrete tips on what to write in the CV for this job"]}

JOB DESCRIPTION:
${data.jd.slice(0, 15000)}`;
    return generateValidated(AnalysisSchema, prompt, "analyzeJd");
  });

export const scoreCvAgainstJob = createServerFn({ method: "POST" })
  .validator((i: { jd: string; cv: string; language?: string }) =>
    z.object({ jd: z.string().min(30).max(20000), cv: z.string().min(30).max(40000), language: z.string().max(10).optional() }).parse(i))
  .handler(async ({ data }) => {
    const prompt = `You are an ATS and recruiting expert. Compare the CV with the job description honestly.
Score 0-100 (90+ exceptional, 75-89 strong, 60-74 fair, <60 weak). Write all text in ${langName(data.language)}.
Return STRICT JSON:
{"score":0,"verdict":"1-2 sentences","whatYouHave":["strengths in the CV that match"],"whatIsMissing":["requirements the CV does not show"],"whatToAdd":["specific, actionable edits to make"],"keywordsMissing":["ATS keywords absent from the CV"]}

JOB DESCRIPTION:
${data.jd.slice(0, 10000)}

CV:
${data.cv.slice(0, 14000)}`;
    return generateValidated(MatchSchema, prompt, "scoreCv");
  });

export const tailorCv = createServerFn({ method: "POST" })
  .validator((i: { jd: string; cv: string; advice: string[]; language?: string }) =>
    z.object({
      jd: z.string().min(30).max(20000),
      cv: z.string().min(30).max(40000),
      advice: z.array(z.string().max(500)).max(40),
      language: z.string().max(10).optional(),
    }).parse(i))
  .handler(async ({ data }) => {
    const prompt = `You are a professional CV writer. Rewrite the candidate's CV so it targets the job below, applying the recommendations.
Rules: keep facts truthful — never invent employers, dates, degrees or certificates. Reword, reorder and emphasise real experience; add missing keywords only where the CV supports them; where a gap cannot be filled honestly, add a short "[Add: ...]" placeholder for the candidate to complete.
Use clear plain-text sections: NAME & CONTACT, PROFESSIONAL SUMMARY, KEY SKILLS, EXPERIENCE (bullet points starting with "- ", action verbs, quantified results), EDUCATION, CERTIFICATIONS, LANGUAGES.
Write in ${langName(data.language)}.
Return STRICT JSON: {"cv":"the full rewritten CV as plain text with \\n line breaks"}

RECOMMENDATIONS:
${data.advice.map((a) => "- " + a).join("\n")}

JOB DESCRIPTION:
${data.jd.slice(0, 8000)}

ORIGINAL CV:
${data.cv.slice(0, 14000)}`;
    return generateValidated(TailorSchema, prompt, "tailorCv");
  });
