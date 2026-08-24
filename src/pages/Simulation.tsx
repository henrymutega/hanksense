
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useCandidates, setCandidates, moveStage } from "@/lib/store";
import { generateCandidates, computeScore, type Candidate } from "@/lib/mockData";
import { ScoreBadge, StageBadge } from "@/pages/Candidates";
import { Play, Upload, RefreshCw, Sparkles, ChevronRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";



const DEMO_CV = `Alex Thompson
alex.thompson@university.edu | London, UK

EXPERIENCE
4 years building production React applications. Led migration of legacy
Angular dashboard to React + TypeScript. Comfortable with Tailwind,
Next.js, AWS Lambda, and writing tests with Jest.

EDUCATION
BSc Computer Science, University College London, 2022

SKILLS
React, TypeScript, Next.js, Tailwind, AWS, Jest, Accessibility, GraphQL`;

function parseCv(text: string, idx: number): Candidate {
  const name = (text.split("\n")[0] || `Student ${idx + 1}`).trim();
  const skillLine = text.match(/SKILLS[\s\S]*?([A-Za-z, .+#-]{5,})/i)?.[1] || "";
  const skills = Array.from(new Set(skillLine.split(/[,\n•]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 25))).slice(0, 12);
  const yearsExp = parseInt(text.match(/(\d+)\s*years?/i)?.[1] || "2", 10);
  const education = (text.match(/(BSc|BEng|BTech|MSc|MEng)[^\n]+/i)?.[0] || "BSc Computer Science").trim().slice(0, 60);
  const score = computeScore({ skills, yearsExp, education });
  const colors = ["#4f46e5","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
  return {
    id: `cv-${Date.now()}-${idx}`,
    name,
    email: name.toLowerCase().replace(/\s+/g, ".") + "@student.edu",
    role: "Senior Frontend Developer",
    location: "Classroom",
    yearsExp,
    education,
    skills: skills.length ? skills : ["React", "JavaScript"],
    score,
    stage: "Applied",
    source: "Lecture Upload",
    avatarColor: colors[idx % colors.length],
    appliedDays: 0,
    tags: ["Student CV"],
    acceptanceProb: 75,
    assessment: 70 + (idx % 25),
  };
}

const STEPS = [
  { key: "parse", label: "Stage 5 · CV Parsing", desc: "NLP extracts skills, education, experience from raw text", target: "Screened" },
  { key: "score", label: "Stage 6 · AI Scoring & Ranking", desc: "Compute match scores, rank top candidates", target: "Screened" },
  { key: "shortlist", label: "Stage 8 · Shortlisting (≥75 threshold)", desc: "Auto-promote qualifying candidates", target: "Shortlisted" },
  { key: "interview", label: "Stage 10 · Schedule Interviews", desc: "Top candidates moved to interview stage", target: "Interview" },
  { key: "offer", label: "Stage 14 · Generate Offers (top 1)", desc: "AI drafts offer; recruiter approval required", target: "Offer" },
];

function SimulationPage() {
  const { t } = useTranslation();
  const all = useCandidates();
  const [cvText, setCvText] = useState(DEMO_CV);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const studentCohort = all.filter(c => c.source === "Lecture Upload");

  function addCv() {
    const c = parseCv(cvText, studentCohort.length);
    setCandidates([c, ...all]);
    toast.success(`Parsed CV: ${c.name} · score ${c.score}`);
    setCvText("");
  }

  function loadSample() {
    const sample = generateCandidates(8, "Senior Frontend Developer").map(c => ({ ...c, source: "Lecture Upload", stage: "Applied" as const, id: `cv-${Date.now()}-${c.id}`, location: "Classroom" }));
    setCandidates([...sample, ...all.filter(c => c.source !== "Lecture Upload")]);
    setStep(0);
    toast.success("Loaded 8 sample student CVs");
  }

  function runStep() {
    setRunning(true);
    const cohort = all.filter(c => c.source === "Lecture Upload");
    setTimeout(() => {
      if (step === 0 || step === 1) {
        cohort.forEach(c => moveStage(c.id, "Screened"));
      } else if (step === 2) {
        cohort.filter(c => c.score >= 75).forEach(c => moveStage(c.id, "Shortlisted"));
      } else if (step === 3) {
        cohort.filter(c => c.stage === "Shortlisted" || c.score >= 75).slice(0, 3).forEach(c => moveStage(c.id, "Interview"));
      } else if (step === 4) {
        cohort.filter(c => c.score >= 80).slice(0, 1).forEach(c => moveStage(c.id, "Offer"));
      }
      setStep(s => Math.min(STEPS.length - 1, s + 1));
      setRunning(false);
      toast.success(STEPS[step].label + " complete");
    }, 700);
  }

  function reset() {
    setCandidates(all.filter(c => c.source !== "Lecture Upload"));
    setStep(0);
    toast.message("Classroom cohort cleared");
  }

  const ranked = [...studentCohort].sort((a, b) => b.score - a.score);

  return (
    <div>
      <PageHeader
        title={t("simulation.title")}
        subtitle={t("simulation.subtitle")}
        actions={
          <>
            <button onClick={loadSample} className="text-sm border border-border px-3 py-2 rounded-md flex items-center gap-1 hover:bg-accent"><Upload className="w-4 h-4" /> Load 8 sample CVs</button>
            <button onClick={reset} className="text-sm border border-border px-3 py-2 rounded-md flex items-center gap-1 hover:bg-accent"><RefreshCw className="w-4 h-4" /> Reset cohort</button>
          </>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4 text-primary" /> Upload Student CV (paste text)</h2>
          <textarea value={cvText} onChange={e => setCvText(e.target.value)} rows={10} placeholder="Paste a student CV..." className="w-full bg-background border border-border rounded-md p-3 text-xs font-mono" />
          <button onClick={addCv} disabled={!cvText.trim()} className="mt-3 w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"><Sparkles className="w-4 h-4" /> Parse with AI & add to cohort</button>
          <p className="text-xs text-muted-foreground mt-2">Tip for class: ask 3–4 students to share their CV text. Add each one, then run the pipeline live.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Pipeline Runner</h2>
          <ol className="space-y-2 mb-4">
            {STEPS.map((s, i) => (
              <li key={s.key} className={`flex items-start gap-3 p-3 rounded-lg border ${i === step ? "border-primary bg-primary/5" : i < step ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5" : "border-border"}`}>
                <div className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold shrink-0 ${i < step ? "bg-[color:var(--success)] text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
          <button onClick={runStep} disabled={running || studentCohort.length === 0 || step >= STEPS.length - 1 && false} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <Play className="w-4 h-4" /> {running ? "Running..." : `Run Step ${step + 1}: ${STEPS[step].label.split("·")[1]?.trim() ?? STEPS[step].label}`} <ChevronRight className="w-4 h-4" />
          </button>
          {studentCohort.length === 0 && <p className="text-xs text-muted-foreground text-center mt-2">Add CVs above to begin.</p>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Live Classroom Cohort — Ranked by AI</h2>
          <span className="text-xs text-muted-foreground">{studentCohort.length} student{studentCohort.length !== 1 && "s"} in pipeline</span>
        </div>
        {ranked.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No student CVs yet. Paste one above or click "Load 8 sample CVs".</p>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 font-medium w-8">#</th>
                <th className="font-medium">Student</th>
                <th className="font-medium">Score</th>
                <th className="font-medium">Stage</th>
                <th className="font-medium">Exp</th>
                <th className="font-medium">Top Skills</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c, i) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="py-2 font-mono text-muted-foreground">{i + 1}</td>
                  <td>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.education}</div>
                  </td>
                  <td><ScoreBadge score={c.score} /></td>
                  <td><StageBadge stage={c.stage} /></td>
                  <td>{c.yearsExp}y</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {c.skills.slice(0, 4).map(s => <span key={s} className="text-xs bg-secondary rounded px-1.5 py-0.5">{s}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

export default SimulationPage;
