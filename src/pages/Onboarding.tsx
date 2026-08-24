
import { PageHeader } from "@/components/PageHeader";
import { useCandidates } from "@/lib/store";
import { CheckCircle2, Circle, Laptop, BookOpen, UserPlus, FileSignature } from "lucide-react";
import { useTranslation } from "react-i18next";



function OnboardingPage() {
  const { t } = useTranslation();
  const all = useCandidates();
  const hires = all.filter(c => c.stage === "Hired").slice(0, 4);
  const sample = hires[0] ?? all[0];

  const TASKS = [
    { icon: FileSignature, label: t("onboarding.tasks.contract"), done: true },
    { icon: FileSignature, label: t("onboarding.tasks.idTax"), done: true },
    { icon: Laptop, label: t("onboarding.tasks.laptop"), done: true },
    { icon: UserPlus, label: t("onboarding.tasks.buddy"), done: false },
    { icon: BookOpen, label: t("onboarding.tasks.compliance"), done: false },
    { icon: BookOpen, label: t("onboarding.tasks.eng"), done: false },
  ];

  return (
    <div>
      <PageHeader title={t("onboarding.title")} subtitle={t("onboarding.subtitle")} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-1">
          <h2 className="font-semibold mb-3">{t("onboarding.newHires")}</h2>
          <ul className="space-y-2">
            {hires.length === 0 && <p className="text-sm text-muted-foreground">{t("onboarding.empty")}</p>}
            {hires.map(c => (
              <li key={c.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-semibold text-white" style={{ background: c.avatarColor }}>
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{t("onboarding.startsIn", { n: 3 + (c.appliedDays % 12) })}</div>
                </div>
                <span className="text-xs font-mono">3/6</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
          <h2 className="font-semibold mb-1">{t("onboarding.checklist", { name: sample?.name ?? "—" })}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("onboarding.autoGenFor", { role: sample?.role ?? "—" })}</p>
          <ul className="space-y-3">
            {TASKS.map((task, i) => (
              <li key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${task.done ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5" : "border-border"}`}>
                {task.done
                  ? <CheckCircle2 className="w-5 h-5 text-[color:var(--success)] shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground shrink-0" />}
                <task.icon className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm flex-1 ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.label}</span>
                {!task.done && <button className="text-xs text-primary font-medium">{t("onboarding.markDone")}</button>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
