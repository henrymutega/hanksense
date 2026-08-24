export type Stage =
  | "Applied"
  | "Screened"
  | "Assessment"
  | "Shortlisted"
  | "Interview"
  | "Final Interview"
  | "Offer"
  | "Hired"
  | "Rejected"
  | "Talent Pool";

export const STAGES: Stage[] = [
  "Applied", "Screened", "Assessment", "Shortlisted", "Interview", "Final Interview", "Offer", "Hired", "Rejected", "Talent Pool"
];

export type StageEvent = { stage: Stage; at: number; note?: string };

export type Candidate = {
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  yearsExp: number;
  education: string;
  skills: string[];
  score: number;
  stage: Stage;
  assessment?: number;
  source: string;
  avatarColor: string;
  appliedDays: number;
  tags: string[];
  acceptanceProb?: number;
  jobId?: string;
  history?: StageEvent[];
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  concerns?: string[];
  recommendation?: string;
  phone?: string;
  summary?: string;
};

const FIRST = ["Aarav","Priya","Liam","Olivia","Noah","Emma","Wei","Mei","Sofia","Lucas","Aisha","Omar","Yuki","Hana","Diego","Camila","Ravi","Anya","Mateo","Zara","Ethan","Maya","Kai","Ines","Felix","Nora","Tariq","Lina","Jonas","Sara","Adam","Leah","Marco","Elif","Theo","Iris","Hugo","Ava","Ben","Mira","Daud","Nia","Jin","Riya","Ali","Eve","Sam","Tom","Jade","Ezra"];
const LAST = ["Sharma","Patel","Khan","Singh","Chen","Wang","Garcia","Martinez","Kim","Park","Silva","Nguyen","Tran","Ali","Hassan","Cohen","Brown","Davis","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Lopez","Lee","Walker","Hall","Allen","Young","King","Wright","Scott","Green","Baker","Adams","Nelson"];
const SKILLS = ["React","TypeScript","Next.js","Tailwind","CSS","HTML","JavaScript","Redux","GraphQL","Node.js","AWS","Docker","Jest","Cypress","Vite","Webpack","Figma","Accessibility","Performance","SEO","Storybook","Vue","Angular","Sass","REST APIs"];
const EDU = ["BSc Computer Science","BEng Software","MSc CS","BTech IT","Bootcamp Grad","BSc Information Systems","MEng AI"];
const SOURCES = ["LinkedIn","Indeed","Referral","Company Site","University","Glassdoor"];
const CITIES = ["London","Berlin","Remote","Bangalore","Singapore","Toronto","Dubai","Sydney","Lisbon","Austin"];
const COLORS = ["#4f46e5","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];

const TARGET_SKILLS = ["React","TypeScript","Tailwind","AWS","Next.js","Jest","Accessibility"];

function rand<T>(arr: T[], i: number) { return arr[i % arr.length]; }
function seeded(i: number) { return ((i * 9301 + 49297) % 233280) / 233280; }

export function computeScore(c: Pick<Candidate, "skills" | "yearsExp" | "education">) {
  const matched = c.skills.filter(s => TARGET_SKILLS.includes(s));
  const skillScore = Math.min(45, matched.length * 7);
  const expScore = Math.min(25, c.yearsExp * 4);
  const eduScore = /MSc|MEng/.test(c.education) ? 15 : /BSc|BEng|BTech/.test(c.education) ? 12 : 8;
  const keywordBonus = Math.min(15, matched.length * 2 + (c.yearsExp > 3 ? 5 : 0));
  return Math.max(15, Math.min(99, skillScore + expScore + eduScore + keywordBonus));
}

export function scoreBreakdown(c: Candidate) {
  const matched = c.skills.filter(s => TARGET_SKILLS.includes(s));
  return [
    { label: `${matched.length} matching skills (${matched.join(", ") || "—"})`, value: Math.min(45, matched.length * 7), positive: true },
    { label: `${c.yearsExp} yrs relevant experience`, value: Math.min(25, c.yearsExp * 4), positive: true },
    { label: `Education: ${c.education}`, value: /MSc|MEng/.test(c.education) ? 15 : 12, positive: true },
    { label: "Keyword relevance & seniority signals", value: Math.min(15, matched.length * 2 + (c.yearsExp > 3 ? 5 : 0)), positive: true },
    ...(matched.length < 3 ? [{ label: "Skill gap penalty (core stack)", value: -8, positive: false }] : []),
    ...(c.yearsExp < 2 ? [{ label: "Limited senior-project exposure", value: -5, positive: false }] : []),
  ];
}

export function generateCandidates(n = 240, role = "Senior Frontend Developer"): Candidate[] {
  const out: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    const r1 = seeded(i + 1);
    const r2 = seeded(i + 7);
    const r3 = seeded(i + 13);
    const skillCount = 4 + Math.floor(r1 * 8);
    const skills: string[] = [];
    for (let s = 0; s < skillCount; s++) {
      const sk = SKILLS[Math.floor(seeded(i * 13 + s * 5) * SKILLS.length)];
      if (!skills.includes(sk)) skills.push(sk);
    }
    const yearsExp = Math.floor(r2 * 10);
    const education = rand(EDU, Math.floor(r3 * EDU.length));
    const name = `${rand(FIRST, i)} ${rand(LAST, i * 3 + 1)}`;
    const score = computeScore({ skills, yearsExp, education });
    let stage: Stage = "Applied";
    if (score >= 85) stage = i % 9 === 0 ? "Offer" : i % 7 === 0 ? "Interview" : "Shortlisted";
    else if (score >= 75) stage = i % 4 === 0 ? "Interview" : "Assessment";
    else if (score >= 60) stage = "Screened";
    else if (i % 11 === 0) stage = "Rejected";
    const tags: string[] = [];
    if (score >= 90) tags.push("Top Talent");
    if (score >= 75 && score < 85) tags.push("Silver Medal");
    if (yearsExp >= 6) tags.push("Senior");
    if (skills.includes("AWS")) tags.push("Cloud");
    out.push({
      id: `c-${1000 + i}`,
      name,
      email: name.toLowerCase().replace(" ", ".") + "@mail.com",
      role,
      location: rand(CITIES, i),
      yearsExp,
      education,
      skills,
      score,
      stage,
      assessment: stage === "Assessment" || score >= 70 ? Math.floor(60 + r1 * 40) : undefined,
      source: rand(SOURCES, i),
      avatarColor: COLORS[i % COLORS.length],
      appliedDays: Math.floor(r3 * 28),
      tags,
      acceptanceProb: score >= 70 ? Math.floor(45 + r2 * 50) : undefined,
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

export const JOBS = [
  { id: "j1", title: "Senior Frontend Developer", dept: "Engineering", openings: 1, applicants: 1000, stage: "Active", days: 12, location: "Remote" },
  { id: "j2", title: "Product Designer", dept: "Design", openings: 2, applicants: 412, stage: "Active", days: 8, location: "London" },
  { id: "j3", title: "Data Scientist", dept: "Data", openings: 1, applicants: 287, stage: "Active", days: 21, location: "Berlin" },
  { id: "j4", title: "HR Business Partner", dept: "People", openings: 1, applicants: 95, stage: "Draft", days: 3, location: "Singapore" },
  { id: "j5", title: "DevOps Engineer", dept: "Engineering", openings: 2, applicants: 156, stage: "Active", days: 14, location: "Remote" },
];

export const FUNNEL = [
  { stage: "Applications", value: 1000 },
  { stage: "AI Screened", value: 320 },
  { stage: "Assessment", value: 95 },
  { stage: "Interview", value: 22 },
  { stage: "Offer", value: 3 },
  { stage: "Hired", value: 1 },
];
