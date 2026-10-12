import { Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { SiteChatbot } from "@/components/SiteChatbot";
import { Reveal } from "@/hooks/use-reveal";
import { useGuideLang } from "@/components/GuideArticle";
import { GUIDES } from "@/lib/guides-content";
import { ArrowRight, GraduationCap } from "lucide-react";

export default function Guides() {
  const lang = useGuideLang();
  const T = (en: string, zh: string) => (lang === "zh" ? zh : en);
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PublicNav />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 text-center">
        <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
          <GraduationCap className="w-3 h-3" /> {T("Career & Hiring Academy", "求职与招聘学院")}
        </span>
        <h1 className="mt-5 text-2xl sm:text-4xl font-semibold tracking-tight max-w-3xl mx-auto">
          {T("Learn how hiring really works — then beat it", "了解招聘的真实运作方式，然后脱颖而出")}
        </h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          {T("Free, practical guides written from the recruiter's side of the desk. Pick a topic and start.", "从招聘方视角撰写的免费实用指南。选择一个主题开始吧。")}
        </p>
      </section>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GUIDES.map(g => (
          <Reveal key={g.slug}>
            <Link to={`/guides/${g.slug}` as "/guides/ats"} className="group h-full flex flex-col bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary"><g.icon className="w-5 h-5" /></span>
              <h2 className="mt-4 font-semibold">{g.title[lang]}</h2>
              <p className="mt-1 text-sm text-muted-foreground flex-1">{g.summary[lang]}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">{T("Read guide", "阅读指南")}<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          </Reveal>
        ))}
      </div>
      <SiteChatbot />
    </div>
  );
}
