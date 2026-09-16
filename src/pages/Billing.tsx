
import { accessEnd } from "@/lib/billing";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Check, Sparkles, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";



type Billing = { plan: string; status: string; semester_ends_at: string; activated_at?: string | null };

function BillingPage() {
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const [b, setB] = useState<Billing | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("lecturer_billing").select("*").eq("lecturer_id", user.id).maybeSingle();
    if (data) setB(data as any);
    else if (role === "lecturer") {
      await supabase.from("lecturer_billing").insert({ lecturer_id: user.id });
      load();
    }
  }
  useEffect(() => { load(); }, [user, role]);

  if (role !== "lecturer" && role !== "admin") return <div><PageHeader title={t("billing.title")} subtitle={t("billing.lecturersOnly")} /></div>;

  // The access period runs from the activation date (7 days trial / 90 days active).
  const endsAt = accessEnd(b as any);

  const notExpired = endsAt ? endsAt.getTime() > Date.now() : false;
  const active = (b?.status === "active" || b?.status === "trial") && notExpired;
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000)) : 0;

  const features = t("billing.features", { returnObjects: true }) as string[];

  return (
    <div>
      <PageHeader title={t("billing.title")} subtitle={t("billing.subtitle")} />

      <div className="bg-card border border-border rounded-2xl p-6 max-w-xl">
        <div className="flex items-center gap-2 mb-1"><Sparkles className="w-5 h-5 text-primary" /><div className="font-semibold">{t("billing.planName")}</div></div>
        <div className="text-xs text-muted-foreground mb-2">{t("billing.planDesc")}</div>
        <div className="text-3xl font-bold mb-4">{t("billing.price")}<span className="text-sm font-normal text-muted-foreground">{t("billing.priceSuffix")}</span></div>

        <div className="flex items-center justify-between border-t border-border pt-4 mb-4 gap-3 flex-wrap">
          <div>
            <div className="text-xs text-muted-foreground">{t("billing.status")}</div>
            <div className={`font-semibold text-sm uppercase tracking-wider ${active ? "text-emerald-500" : "text-destructive"}`}>{active ? (b?.status || "—") : "expired"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("billing.activeUntil")}</div>
            <div className="font-medium text-sm">{endsAt ? endsAt.toLocaleDateString(i18n.language) : "—"}</div>
            {b?.activated_at && <div className="text-[11px] text-muted-foreground mt-0.5">Activated {new Date(b.activated_at).toLocaleDateString(i18n.language)} · {b?.status === "trial" ? "7-day trial" : "90-day period"}</div>}
            {active && <div className="text-xs text-emerald-600 mt-0.5">{t("billing.daysLeft", { n: daysLeft })}</div>}
          </div>
        </div>


        <ul className="text-sm space-y-1.5 mb-5">
          {features.map(f => (
            <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{f}</li>
          ))}
        </ul>

        {!active && (
          <div className="flex gap-2 items-start text-sm rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-3 mb-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{t("billing.expiredNote")}</span>
          </div>
        )}
        <div className="text-[11px] text-muted-foreground text-center">{t("billing.periodNote")} {t("billing.adminOnly")}</div>
      </div>
    </div>
  );
}


export default BillingPage;
