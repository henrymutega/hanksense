import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Reveal, useCountUp } from "@/hooks/use-reveal";
import { FileSearch, Gauge, Wand2, ArrowRight, Check, X, Target, ShieldCheck, Gift, Download, Copy } from "lucide-react";

const TXT = {
  en: {
    badge: "For job seekers · AI CV Coach",
    title: "Land more interviews. Decode the job, score your CV, tailor it in minutes.",
    body: "Paste any job ad and see exactly what the recruiter is looking for. Upload your CV, get an honest match score, and let AI rewrite it to fit the role — using only your real experience.",
    cta: "Try CV Coach free",
    note: "First job analysis free · ¥20 per extra job",
    s1: "Decode the job", s1b: "AI pulls out the must-have skills, experience, education and keywords recruiters scan for.",
    s2: "Score your CV", s2b: "A 0–100 match score shows what you already have and what's missing — before you apply.",
    s3: "Tailor & download", s3b: "Get an improved CV aligned to the role. Review, edit, copy or save as PDF.",
    must: "Must-have", exp: "Experience", kw: "Keywords",
    match: "Match score", have: "You have", missing: "Missing",
    before: "Before", after: "After",
    beforeT: "Responsible for social media posts.",
    afterT: "Grew Instagram engagement 42% in 6 months by running data-driven content campaigns.",
    b1: "Beat ATS filters", b1b: "Use the exact keywords hiring systems look for.",
    b2: "Know where you stand", b2b: "An objective score instead of guesswork.",
    b3: "Honest AI", b3b: "Never invents jobs or degrees — it sharpens what's real.",
    b4: "Free to start", b4b: "Your first full analysis and rewrite costs nothing.",
  },
  zh: {
    badge: "求职者专属 · AI 简历教练",
    title: "斩获更多面试：读懂职位要求，为简历评分，几分钟内量身定制。",
    body: "粘贴任意职位广告，立即看清招聘方真正想要什么。上传简历，获得客观匹配分数，并由 AI 基于您的真实经历进行改写，精准契合岗位。",
    cta: "免费试用简历教练",
    note: "首个职位分析免费 · 之后每个职位 ¥20",
    s1: "解析职位", s1b: "AI 提炼必备技能、经验、学历要求及招聘方关注的关键词。",
    s2: "简历评分", s2b: "0–100 匹配分数，投递前就知道您已具备什么、还缺什么。",
    s3: "定制与下载", s3b: "生成贴合岗位的优化简历，可审阅、编辑、复制或保存为 PDF。",
    must: "必备技能", exp: "经验", kw: "关键词",
    match: "匹配分数", have: "已具备", missing: "缺少",
    before: "优化前", after: "优化后",
    beforeT: "负责社交媒体发帖。",
    afterT: "通过数据驱动的内容策略，6 个月内将 Instagram 互动率提升 42%。",
    b1: "通过 ATS 筛选", b1b: "使用招聘系统寻找的精准关键词。",
    b2: "清楚自身定位", b2b: "用客观分数取代猜测。",
    b3: "诚实的 AI", b3b: "绝不虚构经历或学历，只打磨真实内容。",
    b4: "免费开始", b4b: "首次完整分析与改写完全免费。",
  },
};

function ScoreDial({ label }: { label: string }) {
  const { ref, value } = useCountUp(86);
  const c = 2 * Math.PI * 34;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="7" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset 0.3s" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-lg font-semibold tabular-nums"><span ref={ref}>{value}</span></div>
      </div>
      <div className="text-xs text-muted-foreground">{label}<div className="text-sm font-medium text-foreground">/ 100</div></div>
    </div>
  );
}

export function CvCoachShowcase() {
  const { i18n } = useTranslation();
  const T = TXT[i18n.language?.startsWith("zh") ? "zh" : "en"];
  const chip = "text-[11px] rounded-full px-2 py-0.5 border";

  return (
    <section id="cv-coach" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
      <Reveal>
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
            <Target className="w-3 h-3" /> {T.badge}
          </span>
          <h2 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight">{T.title}</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">{T.body}</p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Reveal delay={0}>
          <div className="lp-card h-full bg-card border border-border rounded-2xl p-5">
            <StepHead icon={FileSearch} n={1} title={T.s1} />
            <p className="text-sm text-muted-foreground mt-2">{T.s1b}</p>
            <div className="mt-4 rounded-xl border border-border bg-background/60 p-3 space-y-2.5 text-xs">
              <Row label={T.must}>{["SEO", "Google Ads", "Analytics"].map(s => <span key={s} className={`${chip} border-primary/40 bg-primary/10 text-primary`}>{s}</span>)}</Row>
              <Row label={T.exp}><span className={`${chip} border-border`}>3–5 yrs</span></Row>
              <Row label={T.kw}>{["ROI", "A/B testing", "CRM"].map(s => <span key={s} className={`${chip} border-border text-muted-foreground`}>{s}</span>)}</Row>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="lp-card h-full bg-card border border-border rounded-2xl p-5">
            <StepHead icon={Gauge} n={2} title={T.s2} />
            <p className="text-sm text-muted-foreground mt-2">{T.s2b}</p>
            <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
              <ScoreDial label={T.match} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">{T.have}</div>
                  {["SEO", "Analytics"].map(s => <div key={s} className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" />{s}</div>)}
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{T.missing}</div>
                  {["Google Ads", "A/B testing"].map(s => <div key={s} className="flex items-center gap-1"><X className="w-3 h-3 text-destructive" />{s}</div>)}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={240}>
          <div className="lp-card h-full bg-card border border-border rounded-2xl p-5">
            <StepHead icon={Wand2} n={3} title={T.s3} />
            <p className="text-sm text-muted-foreground mt-2">{T.s3b}</p>
            <div className="mt-4 rounded-xl border border-border bg-background/60 p-3 space-y-2 text-xs">
              <div className="rounded-lg border border-border p-2 text-muted-foreground line-through decoration-destructive/60">
                <span className="no-underline font-medium mr-1">{T.before}:</span>{T.beforeT}
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/10 p-2">
                <span className="font-medium text-primary mr-1">{T.after}:</span>{T.afterT}
              </div>
              <div className="flex gap-2 pt-1">
                <span className={`${chip} border-border inline-flex items-center gap-1`}><Copy className="w-3 h-3" />Copy</span>
                <span className={`${chip} border-border inline-flex items-center gap-1`}><Download className="w-3 h-3" />PDF</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([[Target, T.b1, T.b1b], [Gauge, T.b2, T.b2b], [ShieldCheck, T.b3, T.b3b], [Gift, T.b4, T.b4b]] as const).map(([Icon, h, b], i) => (
          <Reveal key={h} delay={i * 90}>
            <div className="h-full rounded-xl border border-border bg-card/60 p-4">
              <Icon className="w-5 h-5 text-primary" />
              <div className="mt-2 text-sm font-medium">{h}</div>
              <div className="text-xs text-muted-foreground mt-1">{b}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-8 text-center">
          <Link to="/signup" search={{ code: "", role: "individual" as const }}
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:-translate-y-0.5">
            {T.cta}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="mt-2 text-xs text-muted-foreground">{T.note}</div>
        </div>
      </Reveal>
    </section>
  );
}

function StepHead({ icon: Icon, n, title }: { icon: typeof FileSearch; n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="w-5 h-5" /></span>
      <div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Step {n}</div><h3 className="font-medium">{title}</h3></div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-muted-foreground mb-1">{label}</div><div className="flex flex-wrap gap-1">{children}</div></div>;
}
