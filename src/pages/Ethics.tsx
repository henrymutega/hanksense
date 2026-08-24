
import { PageHeader } from "@/components/PageHeader";
import { AlertTriangle, ShieldCheck, Eye, UserCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";



function EthicsPage() {
  const { t } = useTranslation();
  const [explainable, setExplainable] = useState(true);
  const [autoHire, setAutoHire] = useState(false);

  const warnings = [
    { sev: "warning", tt: t("ethics.warn1t"), d: t("ethics.warn1d") },
    { sev: "warning", tt: t("ethics.warn2t"), d: t("ethics.warn2d") },
    { sev: "info", tt: t("ethics.warn3t"), d: t("ethics.warn3d") },
  ];

  return (
    <div>
      <PageHeader title={t("ethics.title")} subtitle={t("ethics.subtitle")} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[color:var(--warning)]" /> {t("ethics.activeWarnings")}</h2>
          {warnings.map((w, i) => (
            <div key={i} className="border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 rounded-lg p-3">
              <div className="font-medium text-sm">{w.tt}</div>
              <div className="text-xs text-muted-foreground mt-1">{w.d}</div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> {t("ethics.complianceControls")}</h2>

          <Toggle icon={Eye} label={t("ethics.explainability")} desc={t("ethics.explainabilityDesc")} on={explainable} setOn={setExplainable} />
          <Toggle icon={UserCheck} label={t("ethics.autoHire")} desc={t("ethics.autoHireDesc")} on={autoHire} setOn={setAutoHire} disabled />

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-2">{t("ethics.gdpr")}</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>{t("ethics.gdpr1")}</li>
              <li>{t("ethics.gdpr2")}</li>
              <li>{t("ethics.gdpr3")}</li>
              <li>{t("ethics.gdpr4")}</li>
              <li>{t("ethics.gdpr5")}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-primary text-primary-foreground rounded-xl p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 shrink-0" />
          <div>
            <div className="font-semibold text-lg">{t("ethics.humanTitle")}</div>
            <p className="text-sm opacity-90 mt-1">{t("ethics.humanBody")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ icon: Icon, label, desc, on, setOn, disabled }: any) {
  return (
    <div className={`flex items-start justify-between gap-4 p-3 rounded-lg border border-border ${disabled ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <button
        onClick={() => !disabled && setOn(!on)}
        disabled={disabled}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default EthicsPage;
