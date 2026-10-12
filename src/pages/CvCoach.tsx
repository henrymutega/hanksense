import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/cv-parser";
import { analyzeJobDescription, scoreCvAgainstJob, tailorCv, type JobAnalysis, type CvMatch } from "@/lib/cv-coach.functions";
import { extractJobFromFile } from "@/lib/jd-extract.functions";
import { PageHeader } from "@/components/PageHeader";
import { PaymentPanel, tagNote, type PayMethod } from "@/components/PaymentMethods";
import { Sparkles, FileSearch, UploadCloud, Wand2, Copy, Download, Loader2, Coins, Plus, CheckCircle2, XCircle, Save } from "lucide-react";

const TXT = {
  en: {
    title: "CV Coach", subtitle: "Analyse any job, score your CV against it, and get an AI-improved CV.",
    credits: "Job analyses", free: "First job is free", left: "left", used: "used",
    needTopup: "You've used all your job analyses. Pay ¥20 (or KES 380 via M-Pesa) for 5 more jobs — the admin confirms once payment is received.",
    notePh: "Payment reference (e.g. WeChat/Alipay transaction ID)", request: "Request 5 more jobs (¥20 / KES 380)",
    pending: "Top-up request pending admin confirmation.", declined: "Your last request was declined. You can submit a new one.",
    newJob: "New job", history: "My jobs", none: "No jobs yet — paste your first job description.",
    step1: "1. Job description", jobTitle: "Job title (optional)", company: "Company (optional)",
    jdPh: "Paste the full job description from any site, or write it here…", analyze: "Analyse job",
    summary: "Summary", resp: "Key responsibilities", must: "Must-have skills", nice: "Nice-to-have skills",
    exp: "Experience", edu: "Education", keywords: "Keywords to include", tips: "What to write in your CV",
    step2: "2. Your CV", upload: "Upload CV (PDF, DOCX or TXT)", cvPh: "…or paste your CV text here", score: "Score my CV",
    have: "What you have", missing: "What's missing", add: "What to add", kw: "Missing keywords",
    step3: "3. Improved CV", generate: "Generate improved CV", regenerate: "Regenerate",
    editHint: "Review and edit freely, then save, copy or download.", save: "Save", copy: "Copy", pdf: "Download PDF",
    copied: "Copied to clipboard", saved: "Saved", working: "Working…", reading: "Reading file…",
  },
  zh: {
    title: "简历教练", subtitle: "分析任意职位，为您的简历评分，并由 AI 生成优化后的简历。",
    credits: "职位分析次数", free: "首个职位免费", left: "剩余", used: "已用",
    needTopup: "您的职位分析次数已用完。支付 ¥20（M-Pesa 为 380 肯尼亚先令）可再获得 5 次——管理员确认收款后开通。",
    notePh: "付款凭证（如微信/支付宝交易单号）", request: "申请增加 5 次（¥20 / 380 KES）",
    pending: "充值申请等待管理员确认。", declined: "上次申请被拒绝，您可以重新提交。",
    newJob: "新职位", history: "我的职位", none: "暂无职位——粘贴您的第一个职位描述。",
    step1: "1. 职位描述", jobTitle: "职位名称（可选）", company: "公司（可选）",
    jdPh: "从任意网站粘贴完整职位描述，或在此输入…", analyze: "分析职位",
    summary: "概要", resp: "主要职责", must: "必备技能", nice: "加分技能",
    exp: "经验要求", edu: "学历", keywords: "建议包含的关键词", tips: "简历中应写的内容",
    step2: "2. 您的简历", upload: "上传简历（PDF、DOCX 或 TXT）", cvPh: "…或在此粘贴简历文本", score: "为我的简历评分",
    have: "您已具备", missing: "缺少的内容", add: "建议补充", kw: "缺少的关键词",
    step3: "3. 优化后的简历", generate: "生成优化简历", regenerate: "重新生成",
    editHint: "可自由审阅和编辑，然后保存、复制或下载。", save: "保存", copy: "复制", pdf: "下载 PDF",
    copied: "已复制", saved: "已保存", working: "处理中…", reading: "正在读取文件…",
  },
};

type Review = {
  id: string; job_title: string | null; company: string | null; job_description: string;
  job_analysis: JobAnalysis | null; original_cv_text: string | null; cv_filename: string | null;
  match_result: CvMatch | null; tailored_cv_text: string | null; created_at: string;
};

export default function CvCoach() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("zh") ? "zh" : "en";
  const T = TXT[lang];
  const { user } = useAuth();

  const analyze = useServerFn(analyzeJobDescription);
  const score = useServerFn(scoreCvAgainstJob);
  const tailor = useServerFn(tailorCv);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [credits, setCredits] = useState({ used: 0, extra: 0 });
  const [reqStatus, setReqStatus] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PayMethod>("alipay");
  const [busy, setBusy] = useState<string | null>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [jdFile, setJdFile] = useState<string | null>(null);
  const readJd = useServerFn(extractJobFromFile);
  const [cv, setCv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: r }, { data: c }, { data: q }] = await Promise.all([
      supabase.from("individual_cv_reviews").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("individual_credits").select("used_slots, extra_slots").eq("user_id", user.id).maybeSingle(),
      supabase.from("individual_topup_requests").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setReviews((r as unknown as Review[]) ?? []);
    setCredits({ used: c?.used_slots ?? 0, extra: c?.extra_slots ?? 0 });
    setReqStatus(q?.status ?? null);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const current = reviews.find(r => r.id === sel) ?? null;
  useEffect(() => {
    setCv(current?.original_cv_text ?? "");
    setFileName(current?.cv_filename ?? null);
    setDraft(current?.tailored_cv_text ?? "");
  }, [current?.id]);

  const limit = 1 + credits.extra;
  const remaining = Math.max(0, limit - credits.used);

  async function patch(id: string, values: Partial<Review>) {
    const { error } = await supabase.from("individual_cv_reviews").update(values as never).eq("id", id);
    if (error) throw error;
    setReviews(rs => rs.map(r => (r.id === id ? { ...r, ...values } : r)));
  }

  async function runAnalyze() {
    if (remaining <= 0) return toast.error(T.needTopup);
    setBusy("analyze");
    try {
      const a = await analyze({ data: { jd, language: lang } });
      const { data, error } = await supabase.from("individual_cv_reviews").insert({
        user_id: user!.id, job_description: jd,
        job_title: jobTitle || a.jobTitle || null, company: company || a.company || null,
        job_analysis: a as never,
      }).select("*").single();
      if (error) throw error;
      setJd(""); setJdFile(null); setJobTitle(""); setCompany("");
      await load();
      setSel(data.id);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  async function onJdFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) return toast.error(lang === "zh" ? "文件过大（最大 6 MB）。" : "File too large (max 6 MB).");
    setBusy("jdfile");
    try {
      const isImg = f.type.startsWith("image/");
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      let text = "";
      if (!isImg) text = (await extractTextFromFile(f)).replace(/\s+\n/g, "\n").trim();
      if (isImg || (isPdf && text.length < 30)) {
        const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
        const out = await readJd({ data: { dataUrl, mime: isPdf ? "application/pdf" : f.type, filename: f.name } });
        if ("error" in out && out.error) throw new Error(out.error);
        text = (out as { text: string }).text;
      }
      if (text.length < 30) throw new Error(lang === "zh" ? "无法读取该文件，请直接粘贴文本。" : "Could not read text from this file. Try pasting it instead.");
      setJd(prev => (prev.trim() ? prev.trim() + "\n\n" : "") + text.slice(0, 20000));
      setJdFile(f.name);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy("file");
    try {
      const text = (await extractTextFromFile(f)).replace(/\s+\n/g, "\n").trim();
      if (text.length < 30) throw new Error("Could not read text from this file. Try pasting it instead.");
      setCv(text.slice(0, 40000)); setFileName(f.name);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  async function runScore() {
    if (!current) return;
    setBusy("score");
    try {
      const m = await score({ data: { jd: current.job_description, cv, language: lang } });
      await patch(current.id, { match_result: m, original_cv_text: cv, cv_filename: fileName });
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  async function runTailor() {
    if (!current?.match_result) return;
    setBusy("tailor");
    try {
      const m = current.match_result;
      const res = await tailor({ data: { jd: current.job_description, cv, advice: [...m.whatToAdd, ...m.whatIsMissing, ...m.keywordsMissing.map(k => `Keyword: ${k}`)].slice(0, 40), language: lang } });
      setDraft(res.cv);
      await patch(current.id, { tailored_cv_text: res.cv });
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  async function saveDraft() {
    if (!current) return;
    try { await patch(current.id, { tailored_cv_text: draft }); toast.success(T.saved); } catch (e) { toast.error((e as Error).message); }
  }

  function downloadPdf() {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: string) => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(current?.job_title || "CV")}</title>
<style>@page{margin:18mm}body{font-family:Georgia,"Noto Serif SC",serif;font-size:11pt;line-height:1.5;color:#111;white-space:pre-wrap}</style></head>
<body>${esc(draft)}<script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  }

  async function requestTopup() {
    setBusy("topup");
    const { error } = await supabase.rpc("request_individual_topup", { _note: tagNote(method, note) });
    if (!error) setPayOpen(false);
    setBusy(null);
    if (error) return toast.error(error.message);
    setNote(""); load();
  }

  const box = "bg-card border border-border rounded-xl p-4 sm:p-5";
  const input = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm";
  const btn = "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
  const ghost = "inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50";
  const List = ({ title, items, tone }: { title: string; items: string[]; tone?: "good" | "bad" }) => items.length ? (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{title}</div>
      <ul className="space-y-1 text-sm">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            {tone === "good" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> : tone === "bad" ? <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" /> : <span className="text-primary">•</span>}
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;
  const Chips = ({ title, items }: { title: string; items: string[] }) => items.length ? (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">{items.map((s, i) => <span key={i} className="text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1">{s}</span>)}</div>
    </div>
  ) : null;

  const a = current?.job_analysis;
  const m = current?.match_result;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title={T.title} subtitle={T.subtitle} />

      {remaining <= 0 && (
        <div className={`${box} mb-6 flex flex-col sm:flex-row sm:items-center gap-3`}>
          <p className="text-sm">{lang === "zh" ? "您的职位分析次数已用完。" : "You've used all your job analyses."}</p>
          <Link to="/billing" className={`${ghost} sm:ml-auto`}>{lang === "zh" ? "前往账单" : "Go to Billing"}</Link>
        </div>
      )}


      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className={`${box} h-fit`}>
          <button className={`${btn} w-full mb-3`} onClick={() => setSel(null)}><Plus className="w-4 h-4" /> {T.newJob}</button>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{T.history}</div>
          {reviews.length === 0 ? <p className="text-xs text-muted-foreground">{T.none}</p> : (
            <ul className="space-y-1">
              {reviews.map(r => (
                <li key={r.id}>
                  <button onClick={() => setSel(r.id)} className={`w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent ${sel === r.id ? "bg-accent" : ""}`}>
                    <div className="font-medium truncate">{r.job_title || "—"}</div>
                    <div className="text-xs text-muted-foreground flex justify-between gap-2">
                      <span className="truncate">{r.company || new Date(r.created_at).toLocaleDateString(lang)}</span>
                      {r.match_result && <span className="text-primary font-semibold">{Math.round(r.match_result.score)}%</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="space-y-6 min-w-0">
          {!current ? (
            <section className={box}>
              <h2 className="font-semibold mb-3 flex items-center gap-2"><FileSearch className="w-4 h-4 text-primary" /> {T.step1}</h2>
              <div className="grid sm:grid-cols-2 gap-2 mb-2">
                <input className={input} placeholder={T.jobTitle} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                <input className={input} placeholder={T.company} value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <label className={`${ghost} cursor-pointer mb-2`}>
                {busy === "jdfile" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {busy === "jdfile" ? T.reading : jdFile || (lang === "zh" ? "上传职位描述（PDF、照片、截图、DOCX 或 TXT）" : "Upload job ad (PDF, photo, screenshot, DOCX or TXT)")}
                <input type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,image/*,application/pdf,text/plain" className="hidden" onChange={e => { onJdFile(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <textarea className={`${input} min-h-64`} placeholder={T.jdPh} value={jd} onChange={e => setJd(e.target.value)} />
              <div className="mt-3 flex justify-end">
                <button className={btn} disabled={jd.trim().length < 30 || busy === "analyze" || remaining <= 0} onClick={runAnalyze}>
                  {busy === "analyze" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {busy === "analyze" ? T.working : T.analyze}
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className={box}>
                <h2 className="font-semibold mb-1">{current.job_title || "—"}{current.company ? ` · ${current.company}` : ""}</h2>
                {a && (
                  <div className="space-y-4 mt-3">
                    {a.summary && <p className="text-sm text-muted-foreground">{a.summary}</p>}
                    <div className="grid md:grid-cols-2 gap-4">
                      <List title={T.resp} items={a.keyResponsibilities} />
                      <List title={T.tips} items={a.cvTips} />
                    </div>
                    <Chips title={T.must} items={a.mustHaveSkills} />
                    <Chips title={T.nice} items={a.niceToHaveSkills} />
                    <Chips title={T.keywords} items={a.keywords} />
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      {a.experience && <div><span className="font-semibold">{T.exp}: </span>{a.experience}</div>}
                      {a.education && <div><span className="font-semibold">{T.edu}: </span>{a.education}</div>}
                    </div>
                  </div>
                )}
              </section>

              <section className={box}>
                <h2 className="font-semibold mb-3 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-primary" /> {T.step2}</h2>
                <label className={`${ghost} cursor-pointer mb-2`}>
                  {busy === "file" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {busy === "file" ? T.reading : fileName || T.upload}
                  <input type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
                </label>
                <textarea className={`${input} min-h-48`} placeholder={T.cvPh} value={cv} onChange={e => setCv(e.target.value)} />
                <div className="mt-3 flex justify-end">
                  <button className={btn} disabled={cv.trim().length < 30 || busy === "score"} onClick={runScore}>
                    {busy === "score" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />} {busy === "score" ? T.working : T.score}
                  </button>
                </div>
                {m && (
                  <div className="mt-5 border-t border-border pt-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-bold ${m.score >= 75 ? "text-primary" : m.score >= 60 ? "text-foreground" : "text-destructive"}`}>{Math.round(m.score)}%</div>
                      <p className="text-sm text-muted-foreground">{m.verdict}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <List title={T.have} items={m.whatYouHave} tone="good" />
                      <List title={T.missing} items={m.whatIsMissing} tone="bad" />
                    </div>
                    <List title={T.add} items={m.whatToAdd} />
                    <Chips title={T.kw} items={m.keywordsMissing} />
                  </div>
                )}
              </section>

              {m && (
                <section className={box}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h2 className="font-semibold flex items-center gap-2 mr-auto"><Wand2 className="w-4 h-4 text-primary" /> {T.step3}</h2>
                    <button className={btn} disabled={busy === "tailor"} onClick={runTailor}>
                      {busy === "tailor" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} {busy === "tailor" ? T.working : draft ? T.regenerate : T.generate}
                    </button>
                  </div>
                  {draft && (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">{T.editHint}</p>
                      <textarea className={`${input} min-h-[480px] font-mono text-[13px] leading-relaxed`} value={draft} onChange={e => setDraft(e.target.value)} />
                      <div className="mt-3 flex flex-wrap gap-2 justify-end">
                        <button className={ghost} onClick={saveDraft}><Save className="w-4 h-4" /> {T.save}</button>
                        <button className={ghost} onClick={() => { navigator.clipboard.writeText(draft); toast.success(T.copied); }}><Copy className="w-4 h-4" /> {T.copy}</button>
                        <button className={btn} onClick={downloadPdf}><Download className="w-4 h-4" /> {T.pdf}</button>
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
