
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";



type Billing = { plan: string; status: string; semester_ends_at: string };

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

  async function renew() {
    const ends = new Date();
    ends.setMonth(ends.getMonth() + 4);
    const { error } = await supabase.from("lecturer_billing").update({ status: "active", semester_ends_at: ends.toISOString(), updated_at: new Date().toISOString() }).eq("lecturer_id", user!.id);
    if (error) toast.error(error.message); else { toast.success(t("billing.renewed")); load(); }
  }

  if (role !== "lecturer" && role !== "admin") return <div><PageHeader title={t("billing.title")} subtitle={t("billing.lecturersOnly")} /></div>;
  const active = b?.status === "active" || b?.status === "trial";
  const features = t("billing.features", { returnObjects: true }) as string[];

  return (
    <div>
      <PageHeader title={t("billing.title")} subtitle={t("billing.subtitle")} />

      <div className="bg-card border border-border rounded-2xl p-6 max-w-xl">
        <div className="flex items-center gap-2 mb-1"><Sparkles className="w-5 h-5 text-primary" /><div className="font-semibold">{t("billing.planName")}</div></div>
        <div className="text-xs text-muted-foreground mb-2">{t("billing.planDesc")}</div>
        <div className="text-3xl font-bold mb-4">{t("billing.price")}<span className="text-sm font-normal text-muted-foreground">{t("billing.priceSuffix")}</span></div>

        <div className="flex items-center justify-between border-t border-border pt-4 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">{t("billing.status")}</div>
            <div className={`font-semibold text-sm uppercase tracking-wider ${active ? "text-emerald-500" : "text-destructive"}`}>{b?.status || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("billing.activeUntil")}</div>
            <div className="font-medium text-sm">{b?.semester_ends_at ? new Date(b.semester_ends_at).toLocaleDateString(i18n.language) : "—"}</div>
          </div>
        </div>

        <ul className="text-sm space-y-1.5 mb-5">
          {features.map(f => (
            <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{f}</li>
          ))}
        </ul>

        <button onClick={renew} className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-medium text-sm">{t("billing.renew")}</button>
        <div className="text-[11px] text-muted-foreground text-center mt-2">{t("billing.demoNote")}</div>
      </div>
    </div>
  );
}

export default BillingPage;
