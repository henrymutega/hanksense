export type Stage = "applied" | "ai_screened" | "assessment" | "shortlisted" | "interview" | "offer" | "hired" | "rejected" | "talent_pool";

export const STAGES: Stage[] = ["applied", "ai_screened", "assessment", "shortlisted", "interview", "offer", "hired"];

export const STAGE_LABEL: Record<Stage, string> = {
  applied: "Applied",
  ai_screened: "AI Screened",
  assessment: "Assessment",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  talent_pool: "Talent Pool",
};

export type SessionJob = {
  id: string;
  session_id: string;
  class_id: string;
  lecturer_id: string;
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
  bias_notes: Array<{ term: string; suggest: string; reason: string }>;
  status: "draft" | "posted" | "closed";
  created_at: string;
};

export type SessionCandidate = {
  id: string;
  job_id: string;
  session_id: string;
  class_id: string;
  name: string;
  email: string | null;
  cv_text: string | null;
  cv_summary: string | null;
  skills: string[];
  experience_years: number | null;
  score: number;
  ai_explanation: string | null;
  matching_skills: string[];
  missing_skills: string[];
  recommendation: string | null;
  stage: Stage;
  created_at: string;
};

export const DEMO_CANDIDATES = [
  { name: "Alex Dang", score: 95, skills: ["SEO", "SEM", "Google Ads", "Marketing Analytics", "HubSpot", "Conversion Optimization", "Brand Management"], missing: ["Snowflake"], experience: 8, rec: "Strong hire — exceeds all required competencies" },
  { name: "Baatar Ban", score: 92, skills: ["SEM", "Meta Ads", "Google Ads", "Marketing Automation", "Email Marketing", "Campaign Management", "CRM Systems"], missing: ["Brand Management"], experience: 7, rec: "Strong hire — proven paid-media leader" },
  { name: "James Kim", score: 89, skills: ["SEO", "Content Strategy", "Social Media Marketing", "Google Analytics", "HubSpot", "Email Marketing"], missing: ["SEM", "Meta Ads"], experience: 6, rec: "Shortlist — content-led marketer with growth chops" },
  { name: "Wang Li", score: 86, skills: ["Marketing Analytics", "Google Analytics", "Conversion Optimization", "Campaign Management", "CRM Systems"], missing: ["Brand Management", "Content Strategy"], experience: 6, rec: "Shortlist — analytical, strong on measurement" },
  { name: "Humud Jones", score: 82, skills: ["Brand Management", "Social Media Marketing", "Content Strategy", "Campaign Management"], missing: ["SEO", "SEM", "Marketing Analytics"], experience: 5, rec: "Interview — brand-strong but light on performance marketing" },
  { name: "Tom Thi", score: 80, skills: ["Email Marketing", "Marketing Automation", "HubSpot", "CRM Systems"], missing: ["SEM", "SEO", "Meta Ads"], experience: 4, rec: "Interview — lifecycle marketer, needs upskilling on paid" },
];

export const DMM_JOB = {
  title: "Digital Marketing Manager",
  department: "Marketing",
  employment_type: "Full-time",
  location: "Singapore",
  work_mode: "Hybrid",
  seniority: "Senior",
  openings: 1,
  summary: "Lead digital marketing strategy for a multinational e-commerce brand. Own performance marketing, brand, and lifecycle programs across global markets.",
  responsibilities: [
    "Develop and execute the integrated digital marketing strategy",
    "Manage paid media budget across Google, Meta, and emerging channels",
    "Lead SEO, content, and lifecycle marketing programs",
    "Partner with Analytics on attribution, MMM, and incrementality",
    "Build and mentor a team of marketing specialists",
  ],
  required_skills: ["SEO", "SEM", "Google Ads", "Meta Ads", "Marketing Analytics", "Google Analytics", "Campaign Management", "Conversion Optimization"],
  preferred_skills: ["HubSpot", "Marketing Automation", "Brand Management", "Content Strategy", "CRM Systems", "Email Marketing"],
  education: "Bachelor's in Marketing, Business, or related field",
  experience: "6+ years in digital marketing, 2+ leading teams",
  salary_min: 90000,
  salary_max: 140000,
  salary_currency: "USD",
  benefits: ["Health insurance", "Annual bonus", "Learning budget", "Hybrid working"],
  interview_stages: ["Recruiter screen", "Hiring manager", "Case study", "Panel interview", "Offer"],
  bias_notes: [
    { term: "rockstar", suggest: "high-performing", reason: "Excludes candidates uncomfortable with gendered hype language" },
    { term: "young energetic team", suggest: "collaborative team", reason: "Age-coded language may deter older applicants" },
  ],
};
