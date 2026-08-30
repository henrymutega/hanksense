import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateAiText, isAiConfigurationError } from "./ai-gateway";

// =================================================================
// Tolerant schemas with safe defaults — we never throw on missing fields
// =================================================================

const JobSchema = z.object({
  title: z.string().default(""),
  department: z.string().default(""),
  employmentType: z.string().default("Full-time"),
  location: z.string().default(""),
  workMode: z.string().default("Hybrid"),
  seniority: z.string().default("Mid"),
  openings: z.coerce.number().default(1),
  summary: z.string().default(""),
  responsibilities: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  education: z.string().default(""),
  experienceYears: z.string().default(""),
  certifications: z.array(z.string()).default([]),
  salaryMin: z.coerce.number().default(0),
  salaryMedian: z.coerce.number().default(0),
  salaryMax: z.coerce.number().default(0),
  salaryCurrency: z.string().default("USD"),
  benefits: z.array(z.string()).default([]),
  interviewStages: z.array(z.string()).default([]),
  biasFlags: z.array(z.object({
    term: z.string().default(""),
    suggest: z.string().default(""),
    reason: z.string().default(""),
  })).default([]),
});

export type AIJob = z.infer<typeof JobSchema>;

const ProfileSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  currentRole: z.string().default(""),
  currentEmployer: z.string().default(""),
  yearsExperience: z.coerce.number().default(0),
  skills: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  summary: z.string().default(""),
  confidence: z.coerce.number().default(70),
});
export type AIProfile = z.infer<typeof ProfileSchema>;

const MatchSchema = z.object({
  matchScore: z.coerce.number().default(0),
  requiredSkillsMatched: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  recommendation: z.string().default(""),
  yearsExperience: z.coerce.number().default(0),
  estimatedSeniority: z.string().default(""),
});
export type AIMatch = z.infer<typeof MatchSchema>;

// =================================================================
// Helpers — robust JSON extraction & repair
// =================================================================

function stripFences(s: string): string {
  return s
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function extractJson(s: string): string | null {
  const clean = stripFences(s);
  // Find first { or [ and matching last } or ]
  const firstObj = clean.indexOf("{");
  const firstArr = clean.indexOf("[");
  let start = -1;
  let endChar = "}";
  if (firstObj === -1 && firstArr === -1) return null;
  if (firstObj === -1 || (firstArr !== -1 && firstArr < firstObj)) {
    start = firstArr; endChar = "]";
  } else {
    start = firstObj; endChar = "}";
  }
  const end = clean.lastIndexOf(endChar);
  if (end <= start) return null;
  return clean.slice(start, end + 1);
}

function repairJson(s: string): string {
  return s
    .replace(/,\s*([}\]])/g, "$1")        // trailing commas
    .replace(/[\u0000-\u001F]+/g, " ")     // control chars
    .replace(/}\s*{/g, "},{")              // missing commas between objects
    .replace(/(\w)\s*\n\s*"/g, '$1,\n"');  // sometimes missing comma after value
}

function safeJsonParse(raw: string): unknown | null {
  const ex = extractJson(raw);
  if (!ex) return null;
  try { return JSON.parse(ex); } catch { /* try repair */ }
  try { return JSON.parse(repairJson(ex)); } catch { return null; }
}

async function aiJson(prompt: string): Promise<string> {
  return generateAiText(prompt, process.env.LOVABLE_API_KEY, process.env.OPENAI_API_KEY);
}

async function generateValidated<T>(
  schema: z.ZodType<T>,
  prompt: string,
  label: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await aiJson(attempt === 0 ? prompt : prompt + "\n\nIMPORTANT: Your previous response was invalid. Return STRICT JSON only.");
      const parsed = safeJsonParse(raw);
      if (parsed) {
        const result = schema.safeParse(parsed);
        if (result.success) return result.data;
        console.warn(`[${label}] schema validation attempt ${attempt + 1} failed`, result.error.issues.slice(0, 3));
        lastError = new Error("The AI response did not match the expected format.");
      } else {
        console.warn(`[${label}] JSON extraction attempt ${attempt + 1} failed, raw head:`, raw.slice(0, 200));
        lastError = new Error("The AI response could not be parsed.");
      }
    } catch (e) {
      // A missing provider key is a configuration error — retrying is pointless.
      if (isAiConfigurationError(e)) throw e;
      console.warn(`[${label}] generation attempt ${attempt + 1} threw`, (e as Error).message);
      lastError = e;
    }
  }
  // No silent empty-object fallback: surface the real failure.
  throw lastError instanceof Error
    ? lastError
    : new Error(`${label}: AI generation failed. Please try again.`);
}


// =================================================================
// Server Functions
// =================================================================

export const generateJobFromPrompt = createServerFn({ method: "POST" })
  .validator((input: { prompt: string; language?: string }) =>
    z.object({
      prompt: z.string().min(3).max(2000),
      language: z.string().max(20).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const langMap: Record<string, string> = {
      en: "English",
      zh: "Simplified Chinese (简体中文)",
    };
    const langName = langMap[data.language ?? "en"] ?? data.language ?? "English";

    const prompt = `You are an enterprise HR copilot. Generate a COMPLETE, REALISTIC, AND DETAILED job posting from the recruiter request below.

LANGUAGE: Write ALL human-readable text fields (title, department, summary, responsibilities, requiredSkills, preferredSkills, education, experienceYears, certifications, benefits, interviewStages, biasFlags.term/suggest/reason) in ${langName}. Keep enumerated machine values (employmentType, workMode, seniority, salaryCurrency) in English so the UI can parse them.

QUALITY REQUIREMENTS — do NOT return short or sparse output:
- summary: 3–5 rich sentences covering mission, team, and impact
- responsibilities: 7–10 specific, action-oriented bullets
- requiredSkills: 8–12 concrete skills (tools, methods, domain expertise)
- preferredSkills: 5–8 differentiators
- benefits: at least 6 items (compensation, growth, wellbeing, perks)
- interviewStages: 4–6 ordered stages with stage name + short purpose
- salary: provide realistic min, median, max for the role/region
- biasFlags: detect biased/exclusionary language (rockstar, ninja, aggressive, young, native English speaker, recent graduate, etc.) and propose inclusive replacements

Output EXACT JSON matching this shape (all fields required, use empty string/array/0 only when truly unknown):
{
  "title": "string",
  "department": "string",
  "employmentType": "Full-time|Part-time|Contract",
  "location": "string",
  "workMode": "Remote|Hybrid|Onsite",
  "seniority": "Junior|Mid|Senior|Lead",
  "openings": 1,
  "summary": "3-5 sentence role overview",
  "responsibilities": ["string", ...],
  "requiredSkills": ["string", ...],
  "preferredSkills": ["string", ...],
  "education": "string",
  "experienceYears": "e.g. 5+ years",
  "certifications": ["string", ...],
  "salaryMin": 0,
  "salaryMedian": 0,
  "salaryMax": 0,
  "salaryCurrency": "USD",
  "benefits": ["string", ...],
  "interviewStages": ["string", ...],
  "biasFlags": [{"term":"string","suggest":"string","reason":"string"}]
}

Recruiter request: ${data.prompt}`;
    return generateValidated(JobSchema, prompt, "generateJob");
  });


export const parseCvText = createServerFn({ method: "POST" })
  .validator((input: { cvText: string; fileName: string }) =>
    z.object({ cvText: z.string().min(10).max(40000), fileName: z.string().max(300) }).parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = `Extract a structured candidate profile from this CV. Use empty strings/arrays for missing fields. Estimate yearsExperience as integer. confidence 0-100.

Output EXACT JSON:
{
  "fullName":"string","email":"string","phone":"string","location":"string","linkedin":"string",
  "currentRole":"string","currentEmployer":"string","yearsExperience":0,
  "skills":["string"],"education":["string"],"certifications":["string"],"languages":["string"],
  "summary":"2 sentences","confidence":85
}

File: ${data.fileName}

CV:
${data.cvText.slice(0, 14000)}`;
    return generateValidated(ProfileSchema, prompt, "parseCv");
  });

export const matchCvToJob = createServerFn({ method: "POST" })
  .validator((input: { cvText: string; jobTitle: string; requiredSkills: string[]; preferredSkills: string[]; summary: string }) =>
    z.object({
      cvText: z.string().min(20).max(40000),
      jobTitle: z.string().max(200),
      requiredSkills: z.array(z.string()).max(40),
      preferredSkills: z.array(z.string()).max(40),
      summary: z.string().max(4000),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = `Score this candidate against the job. Calibration: 90+ exceptional, 75-89 strong, 60-74 average, <60 weak.

Output EXACT JSON:
{
  "matchScore": 0,
  "requiredSkillsMatched": ["string"],
  "missingSkills": ["string"],
  "strengths": ["string"],
  "concerns": ["string"],
  "recommendation": "1 sentence",
  "yearsExperience": 0,
  "estimatedSeniority": "Junior|Mid|Senior|Lead"
}

JOB: ${data.jobTitle}
Required: ${data.requiredSkills.join(", ")}
Preferred: ${data.preferredSkills.join(", ")}
Summary: ${data.summary}

CV:
${data.cvText.slice(0, 12000)}`;
    return generateValidated(MatchSchema, prompt, "matchCv");
  });
