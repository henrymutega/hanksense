import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LANGS, setLang, type Lang } from "@/lib/i18n";
import { Reveal, useScrollY, useScrollProgress, useCountUp } from "@/hooks/use-reveal";
import {
  Sparkles, Upload, TrendingUp, CalendarClock, GraduationCap, BarChart3,
  ArrowRight, Brain, Check, Languages, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const FUNNEL = [
  { k: "Applied", v: 240 }, { k: "Screened", v: 152 }, { k: "Assessment", v: 88 },
  { k: "Shortlisted", v: 54 }, { k: "Interview", v: 31 }, { k: "Offer", v: 9 }, { k: "Hired", v: 4 },
];

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const { ref, value: v } = useCountUp(value);
  return (
    <div className="lp-card rounded-xl border border-border bg-background/60 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1 tabular-nums">
        <span ref={ref}>{v}</span>{suffix}
      </div>
    </div>
  );
}

export function Landing() {
  const { t, i18n } = useTranslation();
  const current = (i18n.language?.split("-")[0] as Lang) || "en";
  const scrollY = useScrollY();
  const progress = useScrollProgress();
  const scrolled = scrollY > 12;

  const features = [
    { icon: Sparkles, k: "aiJobs" },
    { icon: Upload, k: "screening" },
    { icon: TrendingUp, k: "pipeline" },
    { icon: CalendarClock, k: "interviews" },
    { icon: GraduationCap, k: "classes" },
    { icon: BarChart3, k: "analytics" },
  ] as const;

  const flow = ["Jobs", "Candidates", "Screening", "Pipeline", "Interviews", "Offers", "Hired", "Talent Pool"];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header
        className={`sticky top-0 z-30 border-b transition-all duration-300 ${
          scrolled
            ? "border-border bg-background/70 backdrop-blur-xl shadow-[0_8px_30px_-24px_rgba(0,0,0,0.6)]"
            : "border-transparent bg-background/40 backdrop-blur"
        }`}
      >
        <div
          className="absolute left-0 bottom-0 h-0.5 bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
        <div className={`max-w-6xl mx-auto flex items-center gap-3 px-4 sm:px-6 transition-all duration-300 ${scrolled ? "h-12" : "h-16"}`}>
          <span className="flex items-center gap-2 font-semibold">
            <Brain className={`text-primary transition-all duration-300 ${scrolled ? "w-4 h-4" : "w-5 h-5"}`} /> Hanksense AI
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Languages className="w-4 h-4 text-muted-foreground mr-1" />
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`text-xs px-2 py-1 rounded-md border transition-all duration-200 hover:-translate-y-0.5 ${
                  current === l.code ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                }`}
              >
                <span className="mr-1">{l.flag}</span>{l.label}
              </button>
            ))}
            <Link to="/login" className="ml-2 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors">
              {t("landing.signIn")}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="lp-blob absolute -top-24 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]"
            style={{ transform: `translate3d(-50%, ${scrollY * 0.25}px, 0)` }}
          />
          <div className="lp-blob absolute top-40 -left-24 h-72 w-72 rounded-full bg-chart-2/25 blur-[90px]" style={{ animationDelay: "1.6s" }} />
          <div className="lp-blob absolute top-24 -right-16 h-72 w-72 rounded-full bg-chart-3/20 blur-[90px]" style={{ animationDelay: "3.2s" }} />
        </div>

        <div
          className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center"
          style={{ opacity: Math.max(0, 1 - scrollY / 620), transform: `translateY(${scrollY * 0.08}px)` }}
        >
          <span className="lp-rise lp-pulse inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3" /> {t("landing.badge")}
          </span>
          <h1 className="lp-rise mt-5 text-3xl sm:text-5xl font-semibold tracking-tight max-w-3xl mx-auto" style={{ animationDelay: "120ms" }}>
            <span className="lp-shimmer-text">{t("landing.heroTitle")}</span>
          </h1>
          <p className="lp-rise mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto" style={{ animationDelay: "240ms" }}>
            {t("landing.heroSubtitle")}
          </p>
          <div className="lp-rise mt-7 flex flex-wrap justify-center gap-3" style={{ animationDelay: "360ms" }}>
            <Link
              to="/signup"
              search={{ code: "", role: "" as const }}
              className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--primary)_80%,transparent)]"
            >
              {t("landing.getStarted")}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-accent hover:-translate-y-0.5">
              {t("landing.signIn")}
            </Link>
          </div>
          <ChevronDown className="mx-auto mt-12 w-5 h-5 text-muted-foreground animate-bounce" aria-hidden />
        </div>
      </section>

      {/* FLOW MARQUEE */}
      <div className="lp-marquee relative border-y border-border bg-card/40 py-3 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="lp-marquee-track flex w-max gap-3">
          {[...flow, ...flow].map((s, i) => (
            <span key={`${s}-${i}`} className="flex items-center gap-2 text-xs rounded-full border border-border bg-background px-3 py-1.5 text-muted-foreground whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* DASHBOARD PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <Reveal>
          <div className="lp-card bg-card border border-border rounded-2xl p-5 sm:p-7">
            <h2 className="text-xl font-semibold">{t("landing.dashboardTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{t("landing.dashboardBody")}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
              <Metric label={t("landing.metricJobs")} value={12} />
              <Metric label={t("landing.metricCandidates")} value={240} />
              <Metric label={t("landing.metricPipeline")} value={86} />
              <Metric label={t("landing.metricOffers")} value={9} suffix=" / 4" />
            </div>
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">{t("landing.funnelTitle")}</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={FUNNEL.map(f => ({ ...f, k: t(`stages.${f.k}`, { defaultValue: f.k }) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="k" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} animationDuration={1400} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 grid lg:grid-cols-2 gap-6">
        <Reveal delay={60}>
          <div className="lp-card h-full bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold">{t("landing.whatIsTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t("landing.whatIsBody")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {flow.map((s, i) => (
                <span
                  key={s}
                  className="text-xs rounded-full border border-border px-2.5 py-1 text-muted-foreground transition-all duration-300 hover:border-primary hover:text-primary hover:-translate-y-0.5"
                >
                  {i + 1}. {s}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={160}>
          <div className="lp-card h-full bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold">{t("landing.achieveTitle")}</h2>
            <ul className="mt-3 space-y-3">
              {(["a1", "a2", "a3", "a4"] as const).map((k, i) => (
                <Reveal key={k} delay={200 + i * 90} y={12}>
                  <li className="flex gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{t(`landing.achieve.${k}`)}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.k} delay={(i % 3) * 110}>
              <div className="lp-card group h-full bg-card border border-border rounded-xl p-5">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="w-5 h-5" />
                </span>
                <h3 className="font-medium mt-3">{t(`landing.features.${f.k}`)}</h3>
                <p className="text-sm text-muted-foreground mt-1.5">{t(`landing.features.${f.k}Body`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center">
            <div className="lp-blob pointer-events-none absolute -top-20 left-1/3 h-56 w-56 rounded-full bg-primary/30 blur-[80px]" aria-hidden />
            <h2 className="relative text-2xl font-semibold">{t("landing.ctaTitle")}</h2>
            <p className="relative text-sm text-muted-foreground mt-2">{t("landing.ctaBody")}</p>
            <Link
              to="/signup"
              search={{ code: "", role: "" as const }}
              className="group relative mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5"
            >
              {t("landing.getStarted")}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
