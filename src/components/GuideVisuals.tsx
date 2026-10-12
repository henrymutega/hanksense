import type { GuideSlug, Lang } from "@/lib/guides-content";
import { Check, X, ArrowRight } from "lucide-react";
import cvImg from "@/assets/guides/cv-writing.jpg";
import atsImg from "@/assets/guides/ats.jpg";
import jdImg from "@/assets/guides/job-decoding.jpg";
import emailImg from "@/assets/guides/email-templates.jpg";
import clImg from "@/assets/guides/cover-letters.jpg";
import ivImg from "@/assets/guides/interview-prep.jpg";

type L = { en: string; zh: string };
const t = (l: L, lang: Lang) => l[lang];

export const GUIDE_HERO: Record<GuideSlug, string> = {
  "cv-writing": cvImg, ats: atsImg, "job-decoding": jdImg,
  "email-templates": emailImg, "cover-letters": clImg, "interview-prep": ivImg,
};

export function GuideHero({ slug, alt }: { slug: GuideSlug; alt: string }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border aspect-[2/1] bg-muted">
      <img src={GUIDE_HERO[slug]} alt={alt} width={1600} height={800} className="w-full h-full object-cover" />
    </div>
  );
}

type Step = { k: L; d: L };
type Visual = {
  title: L; sub: L; kind: "flow" | "grid" | "bars";
  steps: Step[]; widths?: number[];
  ba: { title: L; bad: L; badItems: L[]; good: L; goodItems: L[] };
};

const V: Record<GuideSlug, Visual> = {
  ats: {
    title: { en: "How an ATS reads your CV", zh: "ATS 如何读取你的简历" }, sub: { en: "Four stages happen before any human sees it.", zh: "在任何人看到之前，会经历四个阶段。" }, kind: "flow",
    steps: [
      { k: { en: "1. Upload & extract", zh: "1. 上传与提取" }, d: { en: "File converted to plain text", zh: "文件被转为纯文本" } },
      { k: { en: "2. Parse fields", zh: "2. 字段解析" }, d: { en: "Name, titles, dates, skills split out", zh: "拆分姓名、职位、日期、技能" } },
      { k: { en: "3. Keyword index", zh: "3. 关键词索引" }, d: { en: "Terms matched to the job ad", zh: "与职位描述匹配关键词" } },
      { k: { en: "4. Recruiter filter", zh: "4. 招聘者筛选" }, d: { en: "Ranked list; top matches reviewed", zh: "排序后优先查看高匹配者" } },
    ],
    ba: { title: { en: "Parse disaster vs. clean parse", zh: "解析失败 vs. 干净解析" },
      bad: { en: "Two columns, tables, icons", zh: "双栏、表格、图标" },
      badItems: [{ en: "Skills read as “Python Excel 2021 Lead”", zh: "技能被读成“Python Excel 2021 Lead”" }, { en: "Contact info inside header image lost", zh: "页眉图片里的联系方式丢失" }, { en: "Dates merged into wrong role", zh: "日期被归到错误职位" }],
      good: { en: "Single column, standard headings", zh: "单栏、标准标题" },
      goodItems: [{ en: "Every skill indexed separately", zh: "每个技能被单独索引" }, { en: "Contact info in plain text", zh: "联系方式为纯文本" }, { en: "Each role with its own dates", zh: "每个职位日期清晰" }] },
  },
  "cv-writing": {
    title: { en: "The 6-second recruiter scan", zh: "招聘者的 6 秒扫描" }, sub: { en: "Where eyes land first — share of attention.", zh: "目光首先停留的位置——注意力占比。" }, kind: "bars",
    steps: [
      { k: { en: "Current job title", zh: "当前职位" }, d: { en: "Hot zone", zh: "高关注" } },
      { k: { en: "Company & dates", zh: "公司与时间" }, d: { en: "Hot zone", zh: "高关注" } },
      { k: { en: "Top 2 quantified bullets", zh: "前 2 条量化要点" }, d: { en: "Warm", zh: "中等" } },
      { k: { en: "Education", zh: "教育背景" }, d: { en: "Cool", zh: "较低" } },
      { k: { en: "Hobbies / long summary", zh: "爱好 / 长篇简介" }, d: { en: "Skipped", zh: "常被跳过" } },
    ], widths: [92, 80, 64, 30, 8],
    ba: { title: { en: "Task list vs. quantified impact", zh: "任务罗列 vs. 量化成果" },
      bad: { en: "Before", zh: "修改前" },
      badItems: [{ en: "Responsible for social media", zh: "负责社交媒体" }, { en: "Helped with customer service", zh: "协助客户服务" }, { en: "Worked on sales reports", zh: "参与销售报告" }],
      good: { en: "After", zh: "修改后" },
      goodItems: [{ en: "Grew Instagram followers +42% in 6 months via weekly reels", zh: "通过每周短视频，6 个月内粉丝增长 42%" }, { en: "Resolved 30+ tickets/day at 96% satisfaction", zh: "每天处理 30+ 工单，满意度 96%" }, { en: "Automated weekly report, saving 5 hrs/week", zh: "自动化周报，每周节省 5 小时" }] },
  },
  "job-decoding": {
    title: { en: "The job-ad priority matrix", zh: "职位描述优先级矩阵" }, sub: { en: "Sort every line of the ad into one of four boxes.", zh: "将职位描述的每一行归入四个类别之一。" }, kind: "grid",
    steps: [
      { k: { en: "Must-have core skills", zh: "必备核心技能" }, d: { en: "Repeated, listed first, “required” — mirror these exactly", zh: "重复出现、排在前面、标注“必须”——原词呼应" } },
      { k: { en: "The urgent problem", zh: "急需解决的问题" }, d: { en: "“Scale”, “rebuild”, “launch” — lead your pitch with it", zh: "“扩展”“重建”“上线”——以此开场" } },
      { k: { en: "Trainable nice-to-haves", zh: "可培养的加分项" }, d: { en: "“Bonus”, “preferred” — mention if true, don’t panic", zh: "“优先”“加分”——有则提，无需焦虑" } },
      { k: { en: "Boilerplate", zh: "套话" }, d: { en: "“Fast-paced, team player” — show, don’t repeat", zh: "“快节奏、团队合作”——用事例证明，不要照抄" } },
    ],
    ba: { title: { en: "Keyword stuffing vs. problem-solving", zh: "堆砌关键词 vs. 解决问题" },
      bad: { en: "Parroting", zh: "照抄" }, badItems: [{ en: "“I am a fast-paced team player with synergy”", zh: "“我是一个快节奏、有协同精神的团队成员”" }, { en: "Lists every tool from the ad", zh: "列出职位里所有工具" }],
      good: { en: "Proving", zh: "证明" }, goodItems: [{ en: "“You’re scaling support — I cut response time 40% at my last team”", zh: "“你们在扩展客服——我曾将响应时间缩短 40%”" }, { en: "Names the 3 core tools with real results", zh: "用真实成果说明 3 个核心工具" }] },
  },
  "email-templates": {
    title: { en: "The follow-up timeline", zh: "跟进邮件时间线" }, sub: { en: "Three polite touches — never more.", zh: "三次礼貌跟进——不要更多。" }, kind: "flow",
    steps: [
      { k: { en: "Hour 24", zh: "24 小时内" }, d: { en: "Thank-you note with one specific detail", zh: "感谢信，提及一个具体细节" } },
      { k: { en: "Day 7", zh: "第 7 天" }, d: { en: "Gentle status check, 3 sentences", zh: "简短询问进度，3 句话" } },
      { k: { en: "Day 14", zh: "第 14 天" }, d: { en: "Value-add: an idea, article or result", zh: "提供价值：一个想法、文章或成果" } },
      { k: { en: "Then", zh: "之后" }, d: { en: "Move on gracefully — keep the door open", zh: "优雅结束，保持联系" } },
    ],
    ba: { title: { en: "Anxious vs. confident follow-up", zh: "焦虑式 vs. 自信式跟进" },
      bad: { en: "Anxious", zh: "焦虑式" }, badItems: [{ en: "“Just checking again… did you get my last 3 emails?”", zh: "“再问一下……你收到我之前的 3 封邮件了吗？”" }, { en: "Sent every 2 days", zh: "每两天发一次" }],
      good: { en: "Confident", zh: "自信式" }, goodItems: [{ en: "“Thanks again for Tuesday — I sketched the onboarding idea we discussed (attached).”", zh: "“再次感谢周二的交流——附上我们讨论的入职方案草图。”" }, { en: "Spaced out, short, adds value", zh: "间隔合理、简短、有价值" }] },
  },
  "cover-letters": {
    title: { en: "Anatomy of a 3-paragraph letter", zh: "三段式求职信结构" }, sub: { en: "How much space each part deserves.", zh: "每部分应占的篇幅。" }, kind: "bars",
    steps: [
      { k: { en: "Hook — why this company, now", zh: "开头——为何是这家公司、为何现在" }, d: { en: "20%", zh: "20%" } },
      { k: { en: "Proof — two quantified wins", zh: "证明——两个量化成果" }, d: { en: "60%", zh: "60%" } },
      { k: { en: "Action — confident close", zh: "行动——自信收尾" }, d: { en: "20%", zh: "20%" } },
    ], widths: [20, 60, 20],
    ba: { title: { en: "Autobiography vs. pitch", zh: "自传 vs. 推介" },
      bad: { en: "5-paragraph autobiography", zh: "五段式自传" }, badItems: [{ en: "“My name is… I was born in…”", zh: "“我叫……我出生于……”" }, { en: "Repeats the CV line by line", zh: "逐行重复简历" }, { en: "Ends “I hope to hear from you”", zh: "结尾“希望收到回复”" }],
      good: { en: "3-paragraph pitch", zh: "三段式推介" }, goodItems: [{ en: "Opens with their product or goal", zh: "以对方的产品或目标开场" }, { en: "Two numbers that prove fit", zh: "两个数字证明匹配度" }, { en: "Proposes a 15-minute call", zh: "提议 15 分钟通话" }] },
  },
  "interview-prep": {
    title: { en: "Your remote interview studio", zh: "你的远程面试工作室" }, sub: { en: "Four checks before you click Join.", zh: "点击加入前的四项检查。" }, kind: "grid",
    steps: [
      { k: { en: "Camera at eye level", zh: "摄像头与眼睛齐平" }, d: { en: "Stack books; look at the lens when answering", zh: "垫高电脑；回答时看镜头" } },
      { k: { en: "Light in front, 45°", zh: "光源在前方 45°" }, d: { en: "Window or lamp facing you, never behind", zh: "窗户或台灯朝向你，不要背光" } },
      { k: { en: "Clean audio", zh: "清晰的声音" }, d: { en: "Earbuds with mic; close door; mute alerts", zh: "带麦耳机；关门；关闭提醒" } },
      { k: { en: "Calm background", zh: "简洁的背景" }, d: { en: "Tidy wall, plant or bookshelf", zh: "整洁的墙面、绿植或书架" } },
    ],
    ba: { title: { en: "Rambling vs. 90-second STAR", zh: "冗长 vs. 90 秒 STAR" },
      bad: { en: "4-minute ramble", zh: "4 分钟冗长回答" }, badItems: [{ en: "Starts with company history", zh: "从公司历史讲起" }, { en: "“We did…” — your role unclear", zh: "“我们做了……”——个人角色不清" }, { en: "No result or number", zh: "没有结果或数字" }],
      good: { en: "90-second STAR", zh: "90 秒 STAR" }, goodItems: [{ en: "0:00 Situation & Task (20s)", zh: "0:00 情境与任务（20 秒）" }, { en: "0:20 Action — “I…” (50s)", zh: "0:20 行动——“我……”（50 秒）" }, { en: "1:10 Result with a number (20s)", zh: "1:10 带数字的结果（20 秒）" }] },
  },
};

export function GuideVisuals({ slug, lang }: { slug: GuideSlug; lang: Lang }) {
  const v = V[slug];
  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-xl p-5 sm:p-7">
        <div className="text-xs uppercase tracking-wider text-primary">{lang === "zh" ? "信息图" : "Infographic"}</div>
        <h2 className="mt-1 text-lg sm:text-xl font-semibold">{t(v.title, lang)}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t(v.sub, lang)}</p>

        {v.kind === "flow" && (
          <ol className="mt-5 grid gap-3 md:grid-cols-4">
            {v.steps.map((s, i) => (
              <li key={i} className="relative rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="text-sm font-semibold text-primary">{t(s.k, lang)}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(s.d, lang)}</div>
                {i < v.steps.length - 1 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary bg-card rounded-full" />}
              </li>
            ))}
          </ol>
        )}

        {v.kind === "grid" && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {v.steps.map((s, i) => (
              <div key={i} className={`rounded-xl border p-4 ${i < 2 ? "border-primary/40 bg-primary/10" : "border-border bg-muted/40"}`}>
                <div className="text-sm font-semibold">{t(s.k, lang)}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(s.d, lang)}</div>
              </div>
            ))}
          </div>
        )}

        {v.kind === "bars" && (
          <div className="mt-5 space-y-3">
            {v.steps.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm"><span>{t(s.k, lang)}</span><span className="text-muted-foreground text-xs">{t(s.d, lang)}</span></div>
                <div className="mt-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${v.widths?.[i] ?? 50}%`, opacity: 0.35 + (v.widths?.[i] ?? 50) / 150 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl p-5 sm:p-7">
        <div className="text-xs uppercase tracking-wider text-primary">{lang === "zh" ? "前后对比" : "Before / After"}</div>
        <h2 className="mt-1 text-lg sm:text-xl font-semibold">{t(v.ba.title, lang)}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive"><X className="w-4 h-4" />{t(v.ba.bad, lang)}</div>
            <ul className="mt-3 space-y-2">{v.ba.badItems.map((x, i) => <li key={i} className="text-sm text-muted-foreground line-through decoration-destructive/40">{t(x, lang)}</li>)}</ul>
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Check className="w-4 h-4" />{t(v.ba.good, lang)}</div>
            <ul className="mt-3 space-y-2">{v.ba.goodItems.map((x, i) => <li key={i} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />{t(x, lang)}</li>)}</ul>
          </div>
        </div>
      </section>
    </div>
  );
}
