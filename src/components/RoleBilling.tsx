import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStudentJobUsage } from "@/lib/lecturer";
import { PaymentPanel, tagNote, type PayMethod } from "@/components/PaymentMethods";
import { StudentTopUpCard } from "@/components/StudentTopUpCard";
import { Coins, Clock } from "lucide-react";

const box = "bg-card border border-border rounded-xl p-4 sm:p-5";
const input = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm";
const btn = "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";

/** Individual (CV Coach) billing: credits + Alipay/M-Pesa payment request to admin. */
export function IndividualBilling() {
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith("zh");
  const { user } = useAuth();
  const [credits, setCredits] = useState({ used: 0, extra: 0 });
  const [reqStatus, setReqStatus] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PayMethod>("alipay");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: c }, { data: q }] = await Promise.all([
      supabase.from("individual_credits").select("used_slots, extra_slots").eq("user_id", user.id).maybeSingle(),
      supabase.from("individual_topup_requests").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setCredits({ used: c?.used_slots ?? 0, extra: c?.extra_slots ?? 0 });
    setReqStatus(q?.status ?? null);
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);

  const limit = 1 + credits.extra;
  const remaining = Math.max(0, limit - credits.used);

  async function submit() {
    setBusy(true);
    const { error } = await supabase.rpc("request_individual_topup", { _note: tagNote(method, note) });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(zh ? "已发送给管理员确认" : "Sent to admin for confirmation");
    setNote(""); load();
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className={`${box} flex items-center gap-3`}>
        <Coins className="w-5 h-5 text-primary" />
        <div>
          <div className="font-semibold text-sm">{zh ? "职位分析次数" : "Job analyses"}: {remaining} {zh ? "剩余" : "left"} <span className="text-muted-foreground font-normal">({credits.used}/{limit} {zh ? "已用" : "used"})</span></div>
          <div className="text-xs text-muted-foreground">{zh ? "首个职位免费 · ¥20（M-Pesa 380 KES）可分析 5 个职位" : "First job is free · ¥20 (KES 380 on M-Pesa) for the next 5 jobs"}</div>
        </div>
      </div>
      <div className={box}>
        <div className="font-semibold mb-3">{zh ? "购买 5 次职位分析（¥20 / 380 KES）" : "Buy 5 more job analyses (¥20 / KES 380)"}</div>
        {reqStatus === "pending" ? (
          <p className="text-sm text-amber-600 flex items-center gap-2"><Clock className="w-4 h-4" />{zh ? "充值申请等待管理员确认。" : "Your payment is waiting for admin confirmation."}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <PaymentPanel amount={20} kes={380} method={method} onMethod={setMethod} />
            <div>
              {reqStatus === "declined" && <p className="text-xs text-destructive mb-2">{zh ? "上次申请被拒绝，您可以重新提交。" : "Your last request was declined. You can submit a new one."}</p>}
              <p className="text-xs text-muted-foreground mb-2">{zh ? "付款后，请填写交易单号并发送给管理员确认。" : "After paying, enter your transaction reference and send it to the admin to confirm."}</p>
              <textarea className={input} rows={3} placeholder={zh ? "付款凭证（交易单号）" : "Payment reference (transaction ID)"} value={note} onChange={e => setNote(e.target.value)} />
              <button className={`${btn} mt-2 w-full`} disabled={busy || !note.trim()} onClick={submit}>{zh ? "发送给管理员确认" : "Send to admin to confirm"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Student billing: job-post quota + top-up via the shared payment panel. */
export function StudentBilling() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith("zh");
  const [lecturerId, setLecturerId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: m } = await supabase.from("class_memberships").select("class_id").eq("student_id", user.id);
      const ids = (m || []).map((r: any) => r.class_id).filter(Boolean);
      if (ids.length) {
        const { data: c } = await supabase.from("classes").select("lecturer_id").in("id", ids).limit(1);
        setLecturerId((c?.[0] as any)?.lecturer_id ?? null);
      }
      setLoaded(true);
    })();
  }, [user?.id]);

  const usage = useStudentJobUsage(lecturerId);
  if (!loaded) return null;
  if (!lecturerId) return <p className="text-sm text-muted-foreground">{zh ? "请先通过讲师的班级代码加入班级。" : "Join your lecturer's class with a class code first."}</p>;
  return <div className="max-w-3xl"><StudentTopUpCard usage={usage} lecturerId={lecturerId} /></div>;
}
