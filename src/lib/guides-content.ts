import { Cpu, FileText, Search, Mail, PenLine, Video, type LucideIcon } from "lucide-react";

export type GuideSlug = "cv-writing" | "ats" | "job-decoding" | "email-templates" | "cover-letters" | "interview-prep";
export type Lang = "en" | "zh";
type L = { en: string; zh: string };
type LL = { en: string[]; zh: string[] };

export type GuideSection = { title: L; intro?: L; points: LL; dont?: LL };
export type Guide = {
  slug: GuideSlug;
  icon: LucideIcon;
  title: L;
  summary: L;
  intro: L;
  sections: GuideSection[];
  cta: { label: L; to: "/signup" | "/cv-coach" };
};

export const GUIDES: Guide[] = [
  {
    slug: "cv-writing", icon: FileText,
    title: { en: "CV & Resume Writing", zh: "简历写作" },
    summary: { en: "The STAR & XYZ formula, strong bullets and live examples.", zh: "STAR 与 XYZ 公式、有力的要点与实例。" },
    intro: { en: "Recruiters hire results, not duties. Learn to turn every line of your CV into proof of impact.", zh: "招聘方看重成果而非职责。学会把简历每一行变成影响力的证明。" },
    sections: [
      { title: { en: "The XYZ formula", zh: "XYZ 公式" },
        intro: { en: "Accomplished [X], measured by [Y], by doing [Z].", zh: "通过做了 [Z]，实现了 [X]，以 [Y] 衡量。" },
        points: { en: ["Start every bullet with a strong action verb: Led, Built, Reduced, Grew, Launched.", "Add numbers: people, %, money, time saved, volume handled.", "Keep 3–6 bullets per role, most impressive first.", "Cut generic phrases like “hard-working team player”."],
          zh: ["每条以有力的动词开头：主导、搭建、降低、提升、推出。", "加入数字：人数、百分比、金额、节省时间、处理量。", "每段经历 3–6 条，最亮眼的放在最前。", "删除“吃苦耐劳、有团队精神”等空泛表述。"] } },
      { title: { en: "The 6-second recruiter scan", zh: "招聘官的 6 秒扫描" },
        points: { en: ["Put a 2–3 line targeted summary at the top of page one.", "Keep job titles, companies and dates aligned and easy to spot.", "1 page under 5 years' experience; 2 pages max otherwise.", "Name the file clearly: FirstName_LastName_CV.pdf."],
          zh: ["在第一页顶部写 2–3 行有针对性的个人简介。", "职位、公司和日期对齐、一目了然。", "5 年以下经验 1 页；否则最多 2 页。", "文件命名清晰：姓名_简历.pdf。"] } },
    ],
    cta: { label: { en: "Score my CV free", zh: "免费为我的简历评分" }, to: "/signup" },
  },
  {
    slug: "ats", icon: Cpu,
    title: { en: "ATS Secrets", zh: "ATS 筛选秘诀" },
    summary: { en: "Stop auto-rejections: formatting traps and a pre-flight checklist.", zh: "避免被自动淘汰：格式陷阱与投递前检查清单。" },
    intro: { en: "Most employers use an Applicant Tracking System to parse, rank and filter CVs before a human reads them. Being rejected by one is rarely about your talent — it's about format.", zh: "大多数雇主在人工阅读之前用 ATS 解析、排序并筛选简历。被它淘汰往往与能力无关，而是格式问题。" },
    sections: [
      { title: { en: "What the machine wants", zh: "系统想要什么" },
        points: { en: ["Single-column layout with standard headings: Work Experience, Education, Skills.", "Mirror the exact skill names from the job ad.", "Modern AI ATS also matches meaning — describe what you did.", "Submit a text-based PDF or DOCX, never a scanned image."],
          zh: ["单栏布局和标准标题：工作经历、教育背景、技能。", "使用与职位描述完全一致的技能名称。", "现代 AI ATS 也会理解语义——描述你做了什么。", "提交可识别文字的 PDF 或 DOCX，切勿提交扫描图片。"] },
        dont: { en: ["Tables, text boxes and multiple columns", "Skills shown only as icons or bars", "Contact details in headers/footers", "Creative section names"],
          zh: ["表格、文本框和多栏排版", "仅用图标或进度条展示技能", "联系方式放在页眉/页脚", "花哨的栏目名称"] } },
    ],
    cta: { label: { en: "Check my CV against a job", zh: "用职位检测我的简历" }, to: "/signup" },
  },
  {
    slug: "job-decoding", icon: Search,
    title: { en: "Decoding Job Ads", zh: "解读职位广告" },
    summary: { en: "Separate must-haves from the wishlist and find hidden keywords.", zh: "区分硬性要求与愿望清单，找出隐藏关键词。" },
    intro: { en: "A job ad mixes real requirements with a wishlist. Learn to read it like a recruiter so you apply with confidence.", zh: "职位广告混合了真正的要求和愿望清单。像招聘官一样阅读，自信投递。" },
    sections: [
      { title: { en: "Reading the signals", zh: "读懂信号" },
        points: { en: ["“Required / must / essential” = hard requirement.", "“Preferred / a plus / ideally” = wishlist.", "Meet ~70% of requirements? Apply.", "Words repeated in the ad are the real priorities — feature them in your summary.", "Cover gaps with transferable skills, honestly framed."],
          zh: ["“必须/要求/必备” = 硬性要求。", "“优先/加分/最好” = 愿望清单。", "满足约 70% 的要求就可以投递。", "反复出现的词才是真正重点——写进个人简介。", "用可迁移技能诚实地弥补差距。"] } },
    ],
    cta: { label: { en: "Decode a job ad with AI", zh: "用 AI 解读职位广告" }, to: "/signup" },
  },
  {
    slug: "email-templates", icon: Mail,
    title: { en: "Follow-Up Email Playbook", zh: "跟进邮件手册" },
    summary: { en: "Copy-ready thank-yous, check-ins, outreach and offer replies.", zh: "可直接复制的感谢信、跟进、联络与录用回复。" },
    intro: { en: "Following up isn't pushy — it's professional. These short, polite scripts keep you remembered without sounding desperate.", zh: "跟进不是纠缠，而是专业。这些简短礼貌的模板让你被记住，又不显得急切。" },
    sections: [
      { title: { en: "Golden rules", zh: "黄金法则" },
        points: { en: ["Send a thank-you within 24 hours of an interview.", "Wait 5–7 working days before a polite check-in.", "Keep it under 120 words and reference something specific.", "One follow-up after silence is enough; then move on gracefully."],
          zh: ["面试后 24 小时内发送感谢信。", "等待 5–7 个工作日再礼貌跟进。", "控制在 120 字以内，并提及具体细节。", "沉默后跟进一次即可，然后体面地继续前进。"] } },
    ],
    cta: { label: { en: "Get interview-ready free", zh: "免费开始准备" }, to: "/signup" },
  },
  {
    slug: "cover-letters", icon: PenLine,
    title: { en: "3-Paragraph Cover Letters", zh: "三段式求职信" },
    summary: { en: "The Hook-Proof-Action framework with a live builder.", zh: "“吸引-证明-行动”框架与在线生成器。" },
    intro: { en: "Hiring managers skim. A short, specific three-paragraph letter beats a long generic one every time.", zh: "招聘经理只会快速浏览。简短具体的三段式求职信永远胜过冗长空泛的信。" },
    sections: [
      { title: { en: "Hook · Proof · Action", zh: "吸引 · 证明 · 行动" },
        points: { en: ["Hook: why this company, why now — one specific detail.", "Proof: two quantified achievements matching their top needs.", "Action: a confident, polite close inviting a conversation.", "Stay under 250 words."],
          zh: ["吸引：为什么是这家公司、为什么是现在——一个具体细节。", "证明：两项量化成就，对应对方最核心的需求。", "行动：自信礼貌地结尾，邀请进一步沟通。", "控制在 250 字以内。"] },
        dont: { en: ["“To whom it may concern”", "Repeating your CV line by line", "Apologising for missing skills"], zh: ["“敬启者”式开头", "逐行复述简历", "为缺少的技能道歉"] } },
    ],
    cta: { label: { en: "Tailor my CV to this job", zh: "根据职位优化简历" }, to: "/signup" },
  },
  {
    slug: "interview-prep", icon: Video,
    title: { en: "Video Interview Prep", zh: "视频面试准备" },
    summary: { en: "Presence, STAR answers and tech rehearsal for remote interviews.", zh: "远程面试的状态、STAR 回答与设备演练。" },
    intro: { en: "Remote interviews are judged on preparation, clarity and presence as much as content.", zh: "远程面试不仅看内容，也看准备程度、表达清晰度和临场状态。" },
    sections: [
      { title: { en: "Before the call", zh: "面试之前" },
        points: { en: ["Camera at eye level, light in front of you, quiet room.", "Test audio and internet 15 minutes early.", "Prepare 3 stories: impact, teamwork, handling a failure."],
          zh: ["摄像头与视线平齐，光源在前方，环境安静。", "提前 15 分钟测试音频和网络。", "准备 3 个故事：成果、团队合作、应对失败。"] } },
      { title: { en: "During the call", zh: "面试之中" },
        points: { en: ["Answer behavioural questions with STAR in about 90 seconds.", "Look at the camera when making key points.", "Ask: “What does success look like in 90 days?”"],
          zh: ["用 STAR 法在约 90 秒内回答行为面试题。", "讲重点时看向摄像头。", "提问：“90 天内怎样算成功？”"] } },
    ],
    cta: { label: { en: "Start practising free", zh: "免费开始练习" }, to: "/signup" },
  },
];

export const getGuide = (slug: GuideSlug) => GUIDES.find(g => g.slug === slug)!;

export function guideHead(slug: GuideSlug) {
  const g = getGuide(slug);
  const title = `${g.title.en} Guide — Hanksense AI`;
  const url = `https://hanksence.app/guides/${slug}`;
  return {
    meta: [
      { title },
      { name: "description", content: `${g.summary.en} ${g.intro.en}`.slice(0, 158) },
      { property: "og:title", content: title },
      { property: "og:description", content: g.summary.en },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
