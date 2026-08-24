
import { PageHeader, Stat } from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from "recharts";
import { useTranslation } from "react-i18next";



const QOH = [
  { m: "Jan", v: 78 }, { m: "Feb", v: 81 }, { m: "Mar", v: 84 }, { m: "Apr", v: 82 },
  { m: "May", v: 86 }, { m: "Jun", v: 88 },
];
const RETENTION = [
  { m: "M3", v: 96 }, { m: "M6", v: 93 }, { m: "M9", v: 89 }, { m: "M12", v: 87 }, { m: "M18", v: 82 }, { m: "M24", v: 78 },
];

function ReportsPage() {
  const { t } = useTranslation();
  const PERF = [
    { axis: t("reports.axis.Productivity"), A: 88 },
    { axis: t("reports.axis.Collaboration"), A: 92 },
    { axis: t("reports.axis.Innovation"), A: 78 },
    { axis: t("reports.axis.Quality"), A: 85 },
    { axis: t("reports.axis.Leadership"), A: 72 },
    { axis: t("reports.axis.Adaptability"), A: 90 },
  ];
  return (
    <div>
      <PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label={t("reports.qoh")} value="86" tone="success" hint={t("reports.qohHint")} />
        <Stat label={t("reports.retention")} value="87%" tone="success" />
        <Stat label={t("reports.ttp")} value="46d" hint={t("reports.ttpHint")} />
        <Stat label={t("reports.predAttrition")} value={t("reports.predAttritionValue", { n: 9 })} tone="warning" hint={t("reports.predAttritionHint")} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">{t("reports.qohTrend")}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={QOH}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis domain={[60, 100]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">{t("reports.retentionCurve")}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={RETENTION}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis domain={[60, 100]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="v" fill="var(--chart-3)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">{t("reports.perfRadar")}</h2>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={PERF}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
            <Radar name="Cohort" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ReportsPage;
