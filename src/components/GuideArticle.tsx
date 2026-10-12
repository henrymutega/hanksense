import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, type ReactNode } from "react";
import { PublicNav } from "@/components/PublicNav";
import { SiteChatbot } from "@/components/SiteChatbot";
import { Reveal } from "@/hooks/use-reveal";
import { GUIDES, getGuide, type GuideSlug, type Lang } from "@/lib/guides-content";
import { ArrowLeft, ArrowRight, Check, X, ChevronRight, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { GuideHero, GuideVisuals } from "@/components/GuideVisuals";

export function useGuideLang(): Lang {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("zh") ? "zh" : "en";
}

export function GuideArticle({ slug }: { slug: GuideSlug }) {
  const lang = useGuideLang();
  const g = getGuide(slug);
  const idx = GUIDES.findIndex(x => x.slug === slug);
  const prev = GUIDES[idx - 1];
  const next = GUIDES[idx + 1];
  const T = (en: string, zh: string) => (lang === "zh" ? zh : en);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PublicNav showProgress />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{T("Home", "首页")}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/guides" className="hover:text-foreground">{T("Resources", "资源")}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{g.title[lang]}</span>
        </nav>

        <header className="mt-6">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
            <g.icon className="w-6 h-6" />
          </span>
          <h1 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight">{g.title[lang]}</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">{g.intro[lang]}</p>
          <GuideHero slug={slug} alt={g.title[lang]} />
        </header>

        <div className="mt-8 space-y-6">
          <Reveal><GuideVisuals slug={slug} lang={lang} /></Reveal>
          {g.sections.map(s => (
            <Reveal key={s.title.en}>
              <article className="bg-card border border-border rounded-xl p-5 sm:p-7">
                <h2 className="text-lg sm:text-xl font-semibold">{s.title[lang]}</h2>
                {s.intro && <p className="text-sm text-muted-foreground mt-2">{s.intro[lang]}</p>}
                <div className={`mt-4 grid gap-4 ${s.dont ? "md:grid-cols-2" : ""}`}>
                  <ul className="space-y-2">
                    {s.points[lang].map(p => (
                      <li key={p} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />{p}</li>
                    ))}
                  </ul>
                  {s.dont && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-destructive mb-2">{T("Avoid", "避免")}</div>
                      <ul className="space-y-2">
                        {s.dont[lang].map(p => (
                          <li key={p} className="flex gap-2 text-sm"><X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            </Reveal>
          ))}

          <Widget slug={slug} lang={lang} />

          <Reveal>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-semibold">{T("Put it into practice in 2 minutes", "2 分钟内付诸实践")}</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
                {T("Paste a real job ad into CV Coach, upload your CV and get your match score with fixes. Your first job is free.",
                  "把真实的职位广告粘贴到 CV Coach，上传简历，获取匹配分数和修改建议。首个职位免费。")}
              </p>
              <Link to="/signup" search={{ code: "", role: "individual" as const }}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {g.cta.label[lang]} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-3">
            {prev ? (
              <Link to={`/guides/${prev.slug}` as "/guides/ats"} className="rounded-xl border border-border p-4 hover:bg-accent transition-colors">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><ArrowLeft className="w-3 h-3" />{T("Previous", "上一篇")}</div>
                <div className="font-medium mt-1">{prev.title[lang]}</div>
              </Link>
            ) : <div />}
            {next && (
              <Link to={`/guides/${next.slug}` as "/guides/ats"} className="rounded-xl border border-border p-4 hover:bg-accent transition-colors sm:text-right">
                <div className="text-xs text-muted-foreground flex items-center gap-1 sm:justify-end">{T("Next", "下一篇")}<ArrowRight className="w-3 h-3" /></div>
                <div className="font-medium mt-1">{next.title[lang]}</div>
              </Link>
            )}
          </div>
        </div>
      </div>
      <SiteChatbot />
    </div>
  );
}

function Box({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <Reveal>
      <div className="bg-primary/5 border border-primary/30 rounded-xl p-5 sm:p-7">
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{body}</p>
        <div className="mt-4">{children}</div>
      </div>
    </Reveal>
  );
}

function copy(text: string, lang: Lang) {
  navigator.clipboard?.writeText(text).then(() => toast.success(lang === "zh" ? "已复制" : "Copied"));
}

function Widget({ slug, lang }: { slug: GuideSlug; lang: Lang }) {
  const T = (en: string, zh: string) => (lang === "zh" ? zh : en);
  const [open, setOpen] = useState<number | null>(0);
  const [checked, setChecked] = useState<boolean[]>(Array(7).fill(false));
  const [tone, setTone] = useState(0);
  const [cl, setCl] = useState({ company: "", role: "", win1: "", win2: "" });

  if (slug === "cv-writing") {
    const star = lang === "zh"
      ? [["负责社交媒体。", "推出每周短视频系列，3 个月内领英粉丝增长 45%。"], ["帮助客户解决问题。", "每日处理 30+ 客户工单，满意度 96%，升级投诉减少 20%。"], ["参与学生申请工作。", "在 6 个批次中筛选 450+ 份申请资料，入围时间缩短 35%。"]]
      : [["Responsible for social media.", "Grew LinkedIn followers 45% in 3 months by launching a weekly short-video series."], ["Helped customers with problems.", "Resolved 30+ tickets daily with a 96% satisfaction rating, cutting escalations by 20%."], ["Worked on student applications.", "Screened 450+ applicant profiles across 6 cohorts, reducing time-to-shortlist by 35%."]];
    return (
      <Box title={T("Try it: Weak-to-Strong transformer", "试一试：弱变强改写器")} body={T("Tap a weak bullet to see the high-impact version.", "点击一条薄弱的描述，查看高影响力版本。")}>
        <div className="space-y-3">
          {star.map(([w, s], i) => (
            <button key={w} onClick={() => setOpen(open === i ? null : i)} className="w-full text-left rounded-lg border border-border bg-background p-3 hover:border-primary/50 transition-colors">
              <div className="text-sm"><span className="text-xs font-medium text-destructive mr-2">{T("Weak", "薄弱")}</span>{w}</div>
              {open === i && <div className="text-sm mt-2 pt-2 border-t border-border"><span className="text-xs font-medium text-primary mr-2">{T("Strong", "有力")}</span>{s}</div>}
            </button>
          ))}
        </div>
      </Box>
    );
  }

  if (slug === "ats") {
    const checks = lang === "zh"
      ? ["单栏布局", "标准栏目标题", "可识别文字的 PDF 或 DOCX", "包含职位广告中的关键词", "大多数要点含数字", "联系方式在正文中", "文件名清晰"]
      : ["Single-column layout", "Standard section headings", "Text-based PDF or DOCX", "Keywords from the job ad", "Numbers in most bullets", "Contact info in the main body", "Clear file name"];
    const score = Math.round((checked.filter(Boolean).length / checks.length) * 100);
    return (
      <Box title={T("ATS pre-flight checklist", "ATS 投递前检查清单")} body={T("Tick what your CV already does.", "勾选你的简历已经做到的项目。")}>
        <div className="flex items-center justify-between text-sm"><span>{T("ATS readiness", "ATS 就绪度")}</span><span className="text-2xl font-semibold text-primary tabular-nums">{score}%</span></div>
        <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${score}%` }} /></div>
        <div className="mt-4 grid sm:grid-cols-2 gap-2">
          {checks.map((label, i) => (
            <label key={label} className="flex items-center gap-2 text-sm rounded-md border border-border bg-background p-2.5 cursor-pointer hover:bg-accent">
              <input type="checkbox" className="accent-primary" checked={checked[i]} onChange={() => setChecked(p => p.map((v, j) => (j === i ? !v : v)))} />
              {label}
            </label>
          ))}
        </div>
      </Box>
    );
  }

  if (slug === "job-decoding") {
    const ad = lang === "zh"
      ? [["我们正在寻找", ""], ["必须", "must"], ["具备 3 年以上数据分析经验，", ""], ["精通", "must"], [" SQL 和 Excel。", ""], ["熟悉 Python ", ""], ["优先", "nice"], ["。具备优秀的", ""], ["沟通", "key"], ["能力，能与团队", ""], ["沟通", "key"], ["协作。", ""]]
      : [["We are looking for an analyst who ", ""], ["must", "must"], [" have 3+ years of data analysis experience and is ", ""], ["required", "must"], [" to know SQL and Excel. Python is ", ""], ["a plus", "nice"], [". Excellent ", ""], ["communication", "key"], [" skills and the ability to ", ""], ["communicate", "key"], [" insights to stakeholders.", ""]];
    const cls: Record<string, string> = { must: "bg-destructive/15 text-destructive", nice: "bg-muted text-muted-foreground", key: "bg-primary/15 text-primary" };
    return (
      <Box title={T("Highlighter demo", "高亮示例")} body={T("Red = must-have · Grey = wishlist · Blue = repeated priority keyword.", "红色 = 硬性要求 · 灰色 = 愿望清单 · 蓝色 = 反复出现的重点关键词。")}>
        <p className="text-sm leading-7 rounded-lg border border-border bg-background p-4">
          {ad.map(([t, k], i) => k ? <mark key={i} className={`rounded px-1 font-medium ${cls[k]}`}>{t}</mark> : <span key={i}>{t}</span>)}
        </p>
      </Box>
    );
  }

  if (slug === "email-templates") {
    const tones = lang === "zh" ? ["温暖自信", "简洁直接", "正式"] : ["Warm & confident", "Direct & modern", "Formal"];
    const tpl = EMAILS[lang];
    return (
      <Box title={T("Copy-ready templates", "可直接复制的模板")} body={T("Pick a tone, replace the [brackets], and send.", "选择语气，替换[括号]内容后发送。")}>
        <div className="flex flex-wrap gap-2 mb-4">
          {tones.map((t, i) => (
            <button key={t} onClick={() => setTone(i)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${tone === i ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>{t}</button>
          ))}
        </div>
        <div className="space-y-3">
          {tpl.map(e => {
            const body = e.bodies[tone];
            return (
              <div key={e.name} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-medium text-sm">{e.name}</div><div className="text-xs text-muted-foreground">{e.when}</div></div>
                  <button onClick={() => copy(`${e.subject}\n\n${body}`, lang)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-accent shrink-0"><Copy className="w-3 h-3" />{T("Copy", "复制")}</button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{T("Subject", "主题")}: {e.subject}</div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{body}</pre>
              </div>
            );
          })}
        </div>
      </Box>
    );
  }

  if (slug === "cover-letters") {
    const v = (k: keyof typeof cl, ph: string) => cl[k] || ph;
    const letter = lang === "zh"
      ? `尊敬的招聘经理：\n\n我关注 ${v("company", "[公司]")} 已有一段时间，非常希望应聘 ${v("role", "[职位]")} 一职，为团队当前的目标贡献力量。\n\n在过去的工作中，我${v("win1", "[成就一，含数字]")}，并且${v("win2", "[成就二，含数字]")}。这些经验与贵司对该岗位的核心需求高度契合。\n\n期待有机会进一步交流我如何为 ${v("company", "[公司]")} 创造价值。感谢您的时间与考虑。\n\n此致\n[你的姓名]`
      : `Dear Hiring Manager,\n\nI've followed ${v("company", "[Company]")}'s work for some time, and the ${v("role", "[Role]")} position is exactly where I can contribute to what your team is building right now.\n\nIn my recent work, I ${v("win1", "[achievement 1 with a number]")}, and I ${v("win2", "[achievement 2 with a number]")}. Both map directly to the priorities in your job description.\n\nI'd welcome a short conversation about how I could bring the same results to ${v("company", "[Company]")}. Thank you for your time and consideration.\n\nKind regards,\n[Your name]`;
    const fields: [keyof typeof cl, string][] = [["company", T("Company", "公司")], ["role", T("Role", "职位")], ["win1", T("Achievement 1 (e.g. grew sales 30% in 6 months)", "成就一（如 6 个月销售增长 30%）")], ["win2", T("Achievement 2", "成就二")]];
    return (
      <Box title={T("Live cover letter builder", "求职信在线生成器")} body={T("Fill in four fields — your letter writes itself.", "填写四项内容，求职信自动生成。")}>
        <div className="grid sm:grid-cols-2 gap-2">
          {fields.map(([k, label]) => (
            <input key={k} value={cl[k]} onChange={e => setCl(p => ({ ...p, [k]: e.target.value }))} placeholder={label}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          ))}
        </div>
        <pre className="mt-4 whitespace-pre-wrap font-sans text-sm rounded-lg border border-border bg-background p-4">{letter}</pre>
        <button onClick={() => copy(letter, lang)} className="mt-3 inline-flex items-center gap-1 text-sm px-3 py-2 rounded-md border border-border hover:bg-accent"><Copy className="w-4 h-4" />{T("Copy letter", "复制求职信")}</button>
      </Box>
    );
  }

  // interview-prep
  const qs = lang === "zh"
    ? [["请介绍一下你自己。", "现在-过去-未来：当前角色 → 一项相关成就 → 为什么想要这个职位。"], ["讲一次你失败的经历。", "选一个真实的小失败，重点讲你学到了什么、之后如何改进。"], ["你为什么想加入我们？", "提及公司的一个具体项目或价值观，并联系到你的经历。"]]
    : [["Tell me about yourself.", "Present–Past–Future: current role → one relevant win → why this role next."], ["Tell me about a time you failed.", "Pick a real, small failure. Spend most time on what you learned and changed."], ["Why do you want to join us?", "Name one specific project or value of theirs and link it to your experience."]];
  return (
    <Box title={T("Practice: common questions", "练习：常见问题")} body={T("Tap a question to reveal how to structure your answer.", "点击问题，查看回答结构。")}>
      <div className="space-y-3">
        {qs.map(([q, a], i) => (
          <button key={q} onClick={() => setOpen(open === i ? null : i)} className="w-full text-left rounded-lg border border-border bg-background p-3 hover:border-primary/50 transition-colors">
            <div className="text-sm font-medium">{q}</div>
            {open === i && <div className="text-sm mt-2 pt-2 border-t border-border text-muted-foreground">{a}</div>}
          </button>
        ))}
      </div>
    </Box>
  );
}

type Email = { name: string; when: string; subject: string; bodies: [string, string, string] };
const EMAILS: Record<Lang, Email[]> = {
  en: [
    { name: "Post-interview thank you", when: "Within 24 hours", subject: "Thank you — [Role] interview",
      bodies: [
        "Hi [Name],\n\nThank you for your time today. I really enjoyed hearing about [specific project], and it made me even more excited about the [Role] position.\n\nI'm confident my experience in [skill] would help the team hit [goal]. Please let me know if I can share anything else.\n\nBest,\n[Your name]",
        "Hi [Name],\n\nThanks for the conversation today. [Specific project] sounds like a great challenge and I'd love to help deliver it.\n\nHappy to send anything else you need.\n\n[Your name]",
        "Dear [Name],\n\nThank you for the opportunity to interview for the [Role] position today. I appreciated learning about [specific project] and remain very interested in contributing to [Company].\n\nPlease do not hesitate to contact me should you require further information.\n\nYours sincerely,\n[Your name]"] },
    { name: "Polite check-in after silence", when: "5–7 working days later", subject: "Following up — [Role] application",
      bodies: [
        "Hi [Name],\n\nI hope your week is going well. I wanted to follow up on the [Role] position — I'm still very excited about the opportunity. Is there any update on the timeline?\n\nThanks so much,\n[Your name]",
        "Hi [Name],\n\nQuick follow-up on the [Role] role. Any update on next steps? I'm still keen.\n\nThanks,\n[Your name]",
        "Dear [Name],\n\nI am writing to kindly follow up regarding my application for the [Role] position. I remain highly interested and would be grateful for any update on the selection timeline.\n\nKind regards,\n[Your name]"] },
    { name: "LinkedIn connection note", when: "Before or after applying", subject: "(LinkedIn note — 300 characters)",
      bodies: [
        "Hi [Name], I really admire [Company]'s work on [topic]. I've just applied for the [Role] role and would love to connect and learn from your experience there.",
        "Hi [Name] — applied for [Role] at [Company]. Would love to connect.",
        "Dear [Name], I recently applied for the [Role] position at [Company] and would be honoured to connect with you."] },
    { name: "Accepting an offer", when: "After receiving the offer", subject: "Offer acceptance — [Your name]",
      bodies: [
        "Hi [Name],\n\nI'm delighted to accept the offer for the [Role] position! Thank you for this opportunity. I confirm my start date of [date] and look forward to joining the team.\n\nWarmly,\n[Your name]",
        "Hi [Name],\n\nHappy to accept the [Role] offer. Confirming a start date of [date]. Looking forward to it!\n\n[Your name]",
        "Dear [Name],\n\nI am pleased to formally accept the offer of employment for the position of [Role], with a start date of [date]. Thank you for this opportunity.\n\nYours sincerely,\n[Your name]"] },
    { name: "Responding gracefully to rejection", when: "Within 2 days", subject: "Re: [Role] application",
      bodies: [
        "Hi [Name],\n\nThank you for letting me know. While I'm disappointed, I really enjoyed meeting the team. If you have any feedback, I'd value it — and I'd love to be considered for future roles.\n\nAll the best,\n[Your name]",
        "Hi [Name],\n\nThanks for the update. I'd appreciate any feedback, and I'd be glad to be considered for future openings.\n\n[Your name]",
        "Dear [Name],\n\nThank you for informing me of your decision. I appreciated the opportunity to interview and would welcome consideration for future positions.\n\nKind regards,\n[Your name]"] },
  ],
  zh: [
    { name: "面试后感谢信", when: "24 小时内", subject: "感谢面试机会 — [职位]",
      bodies: [
        "[姓名]您好：\n\n感谢您今天抽出时间。听您介绍[具体项目]让我对[职位]更加期待。\n\n我相信我在[技能]方面的经验能帮助团队实现[目标]。如需补充任何资料，请随时告诉我。\n\n祝好\n[你的姓名]",
        "[姓名]您好：\n\n感谢今天的交流。[具体项目]很有挑战，我很希望参与其中。如需其他资料请随时告知。\n\n[你的姓名]",
        "尊敬的[姓名]：\n\n感谢您今天给予我[职位]的面试机会。了解[具体项目]让我获益良多，我仍非常希望为[公司]贡献力量。\n\n如需进一步信息，敬请联系。\n\n此致\n敬礼\n[你的姓名]"] },
    { name: "久无回音的礼貌跟进", when: "5–7 个工作日后", subject: "跟进 — [职位]申请",
      bodies: [
        "[姓名]您好：\n\n希望您这周一切顺利。想跟进一下[职位]的进展——我依然非常期待这个机会。请问目前流程有更新吗？\n\n非常感谢\n[你的姓名]",
        "[姓名]您好：\n\n想简单跟进一下[职位]的下一步安排，我仍然很感兴趣。\n\n谢谢\n[你的姓名]",
        "尊敬的[姓名]：\n\n冒昧来信跟进我对[职位]的申请。我对该职位依然十分感兴趣，如能告知甄选进度，将不胜感激。\n\n此致\n敬礼\n[你的姓名]"] },
    { name: "领英/社交平台添加备注", when: "投递前后", subject: "（备注 — 300 字符以内）",
      bodies: [
        "[姓名]您好，我很欣赏[公司]在[领域]的工作，刚刚申请了[职位]，希望能与您建立联系并向您学习。",
        "[姓名]您好，已申请[公司]的[职位]，希望能加个好友。",
        "尊敬的[姓名]，我近期申请了[公司]的[职位]，如能与您建立联系将深感荣幸。"] },
    { name: "接受录用", when: "收到录用通知后", subject: "接受录用 — [你的姓名]",
      bodies: [
        "[姓名]您好：\n\n非常高兴接受[职位]的录用！感谢这次机会。确认入职日期为[日期]，期待加入团队。\n\n[你的姓名]",
        "[姓名]您好：\n\n接受[职位]录用，确认[日期]入职，期待见面！\n\n[你的姓名]",
        "尊敬的[姓名]：\n\n我谨正式接受[职位]的录用，入职日期为[日期]。感谢贵司给予的机会。\n\n此致\n敬礼\n[你的姓名]"] },
    { name: "得体回应拒信", when: "2 天内", subject: "回复：[职位]申请",
      bodies: [
        "[姓名]您好：\n\n感谢告知。虽然有些遗憾，但很高兴认识团队。如方便，期待您的反馈，也希望未来有机会再合作。\n\n祝一切顺利\n[你的姓名]",
        "[姓名]您好：\n\n感谢告知。如有反馈非常欢迎，也希望未来职位能考虑我。\n\n[你的姓名]",
        "尊敬的[姓名]：\n\n感谢您告知结果。我很珍惜此次面试机会，并希望今后有合适职位时能获得考虑。\n\n此致\n敬礼\n[你的姓名]"] },
  ],
};
