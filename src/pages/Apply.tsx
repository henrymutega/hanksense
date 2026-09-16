import { getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type PublicJob } from "@/lib/apply.functions";
import { extractTextFromFile } from "@/lib/cv-parser";
import { CheckCircle2, FileText, Loader2, MapPin, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Route = getRouteApi("/apply/$jobId");

export default function ApplyPage() {
  const { t } = useTranslation();
  const { jobId } = Route.useParams();

  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/job?jobId=${encodeURIComponent(jobId)}`);
        const body = await res.json();
        setJob(body?.job ?? null);
      } catch {
        setJob(null);
      }
      setLoading(false);
    })();
  }, [jobId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error(t("apply.needFile"));
    setBusy(true);
    try {
      const raw = await extractTextFromFile(file);
      const text = (raw || "").replace(/\s+/g, " ").trim().slice(0, 20000);
      if (text.length < 50) throw new Error(t("apply.tooShort"));
      const res = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId, name, email, cvText: text, fileName: file.name }),
      });
      const bodyText = await res.text();
      let body: any = {};
      try { body = JSON.parse(bodyText); } catch { body = { error: `Server error (${res.status})` }; }
      if (!res.ok || !body?.ok) throw new Error(body?.error || "Submission failed");
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }


  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm font-semibold tracking-tight mb-6">Hanksense AI</div>
        {children}
        <p className="text-[11px] text-muted-foreground text-center mt-8">{t("apply.poweredBy")}</p>
      </div>
    </div>
  );

  if (loading) return shell(<div className="text-sm text-muted-foreground text-center py-16">…</div>);
  if (!job) return shell(<div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">{t("apply.notFound")}</div>);

  if (done) return shell(
    <div className="bg-card border border-border rounded-xl p-10 text-center">
      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-primary" />
      <h1 className="text-lg font-semibold mb-1">{t("apply.success")}</h1>
      <p className="text-sm text-muted-foreground">{t("apply.successBody")}</p>
    </div>
  );

  return shell(
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
          {job.department && <span className="bg-muted px-2 py-1 rounded">{job.department}</span>}
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded"><MapPin className="w-3 h-3" />{job.location || "—"} · {job.work_mode || "—"}</span>
          {job.employment_type && <span className="bg-muted px-2 py-1 rounded">{job.employment_type}</span>}
          {job.seniority && <span className="bg-muted px-2 py-1 rounded">{job.seniority}</span>}
        </div>
        {job.summary && <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{job.summary}</p>}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">{t("apply.aboutRole")}</h2>
        {!!job.responsibilities?.length && (
          <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
            {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
        {!!job.required_skills?.length && (
          <div className="flex flex-wrap gap-1.5">
            {job.required_skills.map(s => <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{s}</span>)}
          </div>
        )}
        {(job.education || job.experience) && (
          <div className="text-sm text-muted-foreground space-y-1">
            {job.education && <div>{job.education}</div>}
            {job.experience && <div>{job.experience}</div>}
          </div>
        )}
      </div>

      {job.status !== "posted" ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">{t("apply.closed")}</div>
      ) : (
        <form onSubmit={onSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">{t("apply.title")}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">{t("apply.fullName")}</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("apply.email")}</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t("apply.cv")}</label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center mt-1"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}>
              {file ? (
                <div className="text-sm inline-flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />{file.name}</div>
              ) : (
                <Upload className="w-7 h-7 mx-auto text-muted-foreground" />
              )}
              <input id="cvFile" type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="cvFile" className="block mt-2 text-xs text-primary hover:underline cursor-pointer">{t("apply.pickCv")}</label>
            </div>
          </div>
          <button disabled={busy} className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {busy ? t("apply.submitting") : t("apply.submit")}
          </button>
        </form>
      )}
    </div>
  );
}
