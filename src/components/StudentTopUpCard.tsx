import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TOPUP_PRICE_CNY, TOPUP_SLOTS, type StudentJobUsage } from "@/lib/lecturer";
import { Sparkles, Coins, Clock, Loader2 } from "lucide-react";
import { PaymentPanel, tagNote, type PayMethod } from "@/components/PaymentMethods";

/**
 * Shown to students: remaining job posts and the paid top-up request flow.
 * Payment happens offline; an admin approves once the money is received.
 */
export function StudentTopUpCard({ usage, lecturerId }: { usage: StudentJobUsage; lecturerId?: string | null }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<PayMethod>("alipay");

  const reached = usage.remaining <= 0;
  const pending = usage.requestStatus === "pending";

  async function submit() {
    if (!lecturerId) return;
    if (!note.trim()) return toast.error(t("topup.notePlaceholder"));
    setSaving(true);
    const { error } = await supabase.rpc("request_job_topup", { _lecturer: lecturerId, _note: tagNote(method, note) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("topup.submitted"));
    setOpen(false);
    setNote("");
    usage.refresh();
  }

  return (
    <div className={`rounded-md border p-3 mb-4 text-sm ${reached ? "bg-destructive/10 border-destructive/40 text-destructive" : "bg-primary/5 border-primary/30 text-primary"}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>
          {reached
            ? t("topup.limitReached", { total: usage.limit })
            : t("topup.remaining", { n: usage.remaining, total: usage.limit })}
        </span>
        {usage.extra > 0 && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600">
            {t("topup.extra", { n: usage.extra })}
          </span>
        )}
        {reached && !pending && lecturerId && !open && (
          <button onClick={() => setOpen(true)} className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90">
            <Coins className="w-3.5 h-3.5" />
            {t("topup.buy", { n: TOPUP_SLOTS, price: TOPUP_PRICE_CNY })}
          </button>
        )}
      </div>

      {pending && (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
          <Clock className="w-3.5 h-3.5" /> {t("topup.pending")}
        </div>
      )}
      {!pending && usage.requestStatus === "declined" && (
        <div className="mt-2 text-xs text-muted-foreground">{t("topup.declined")}</div>
      )}

      {open && (
        <div className="mt-3 space-y-2">
          <PaymentPanel amount={TOPUP_PRICE_CNY} method={method} onMethod={setMethod} />
          <label className="block text-xs text-muted-foreground">{t("topup.noteLabel")}</label>
          <textarea
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t("topup.notePlaceholder")}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
          />
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
              {t("topup.submit")}
            </button>
            <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-accent">
              {t("topup.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
