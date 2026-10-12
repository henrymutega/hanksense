import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy, QrCode, Smartphone, Save, Loader2, Wallet } from "lucide-react";

export type PaySettings = {
  alipay_qr: string | null; mpesa_qr: string | null; mpesa_phone: string | null; mpesa_name: string | null; instructions: string | null;
};
export type PayMethod = "alipay" | "mpesa_qr" | "mpesa_phone";

export function usePaySettings() {
  const [s, setS] = useState<PaySettings | null>(null);
  const load = async () => {
    const { data } = await supabase.from("payment_settings").select("alipay_qr, mpesa_qr, mpesa_phone, mpesa_name, instructions").eq("id", 1).maybeSingle();
    setS((data as PaySettings) ?? { alipay_qr: null, mpesa_qr: null, mpesa_phone: null, mpesa_name: null, instructions: null });
  };
  useEffect(() => { load(); }, []);
  return { settings: s, reload: load };
}

export const methodLabel = (m: PayMethod, zh: boolean) =>
  m === "alipay" ? (zh ? "支付宝" : "Alipay") : m === "mpesa_qr" ? (zh ? "M-Pesa 二维码" : "M-Pesa QR") : (zh ? "M-Pesa 手机号" : "M-Pesa phone");

/** Build the note sent to admin, tagged with the payment method. */
export const tagNote = (m: PayMethod, msg: string, zh = false) => `[${methodLabel(m, zh)}] ${msg.trim()}`;

/** User-facing: shows the admin's Alipay / M-Pesa QR codes and phone number. */
export function PaymentPanel({ amount, kes, method, onMethod }: { amount: number; kes?: number; method: PayMethod; onMethod: (m: PayMethod) => void }) {
  const { i18n } = useTranslation();
  const zh = !!i18n.language?.startsWith("zh");
  const { settings } = usePaySettings();
  const tabs: PayMethod[] = ["alipay", "mpesa_qr", "mpesa_phone"];

  if (!settings) return <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />…</div>;
  const qr = method === "alipay" ? settings.alipay_qr : method === "mpesa_qr" ? settings.mpesa_qr : null;

  return (
    <div className="rounded-lg border border-border bg-background p-3 text-foreground">
      <div className="flex flex-wrap gap-1 mb-3">
        {tabs.map(m => (
          <button key={m} type="button" onClick={() => onMethod(m)}
            className={`text-xs px-2.5 py-1.5 rounded-md border inline-flex items-center gap-1 ${method === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
            {m === "mpesa_phone" ? <Smartphone className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}{methodLabel(m, zh)}
          </button>
        ))}
      </div>
      <p className="text-sm font-medium mb-2">{kes && method !== "alipay" ? (zh ? `请支付 KES ${kes}（约 ¥${amount}）` : `Pay KES ${kes} (≈ ¥${amount})`) : (zh ? `请支付 ¥${amount}` : `Pay ¥${amount}`)}</p>
      {method === "mpesa_phone" ? (
        settings.mpesa_phone ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <div className="text-lg font-semibold tracking-wide">{settings.mpesa_phone}</div>
              {settings.mpesa_name && <div className="text-xs text-muted-foreground">{zh ? "收款人" : "Name"}: {settings.mpesa_name}</div>}
            </div>
            <button type="button" className="ml-auto text-xs border border-border rounded-md px-2 py-1 inline-flex items-center gap-1 hover:bg-accent"
              onClick={() => { navigator.clipboard.writeText(settings.mpesa_phone!); toast.success(zh ? "已复制" : "Copied"); }}>
              <Copy className="w-3 h-3" />{zh ? "复制号码" : "Copy number"}
            </button>
          </div>
        ) : <p className="text-xs text-muted-foreground">{zh ? "管理员尚未设置号码。" : "The admin hasn't set a phone number yet."}</p>
      ) : qr ? (
        <img src={qr} alt={methodLabel(method, zh)} className="w-48 h-48 object-contain rounded-md border border-border bg-card mx-auto" />
      ) : <p className="text-xs text-muted-foreground">{zh ? "管理员尚未上传二维码。" : "The admin hasn't uploaded this QR code yet."}</p>}
      {settings.instructions && <p className="text-xs text-muted-foreground mt-3 whitespace-pre-line">{settings.instructions}</p>}
      <p className="text-xs text-muted-foreground mt-2">{zh ? "付款后，在下方填写交易单号或留言发送给管理员确认。" : "After paying, enter the transaction code or a message below and send it to the admin to confirm."}</p>
    </div>
  );
}

function readImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    if (file.size > 1_500_000) return rej(new Error("Image must be under 1.5 MB"));
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file);
  });
}

/** Admin-facing: edit the QR codes and M-Pesa phone number shown to users. */
export function AdminPaymentSettings() {
  const { i18n } = useTranslation();
  const zh = !!i18n.language?.startsWith("zh");
  const { settings, reload } = usePaySettings();
  const [f, setF] = useState<PaySettings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (settings) setF(settings); }, [settings]);
  if (!f) return null;

  async function pick(key: "alipay_qr" | "mpesa_qr", file?: File) {
    if (!file) return;
    try { const url = await readImage(file); setF(p => p && { ...p, [key]: url }); } catch (e: any) { toast.error(e.message); }
  }
  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("payment_settings").upsert({ id: 1, ...f, updated_at: new Date().toISOString(), updated_by: u.user?.id ?? null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(zh ? "付款信息已保存" : "Payment details saved"); reload();
  }
  const input = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm";
  const QrField = ({ k, label }: { k: "alipay_qr" | "mpesa_qr"; label: string }) => (
    <div>
      <div className="text-xs font-medium mb-1">{label}</div>
      {f[k] ? <img src={f[k]!} alt={label} className="w-32 h-32 object-contain border border-border rounded-md bg-background mb-2" /> : <div className="w-32 h-32 border border-dashed border-border rounded-md mb-2 grid place-items-center text-xs text-muted-foreground">{zh ? "未上传" : "None"}</div>}
      <div className="flex gap-2">
        <input type="file" accept="image/*" className="text-xs max-w-[180px]" onChange={e => pick(k, e.target.files?.[0])} />
        {f[k] && <button type="button" className="text-xs text-destructive" onClick={() => setF({ ...f, [k]: null })}>{zh ? "移除" : "Remove"}</button>}
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl mt-6 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-primary" />
        <div>
          <div className="font-semibold text-sm">{zh ? "收款方式（支付宝 / M-Pesa）" : "Payment details (Alipay / M-Pesa)"}</div>
          <div className="text-xs text-muted-foreground">{zh ? "学生和个人用户充值时会看到这些信息。" : "Students and individuals see these when they top up."}</div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <QrField k="alipay_qr" label={zh ? "支付宝收款码" : "Alipay QR code"} />
        <QrField k="mpesa_qr" label={zh ? "M-Pesa 收款码" : "M-Pesa QR code"} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input className={input} placeholder={zh ? "M-Pesa 手机号" : "M-Pesa phone number"} value={f.mpesa_phone ?? ""} onChange={e => setF({ ...f, mpesa_phone: e.target.value })} />
        <input className={input} placeholder={zh ? "收款人姓名" : "Account name"} value={f.mpesa_name ?? ""} onChange={e => setF({ ...f, mpesa_name: e.target.value })} />
      </div>
      <textarea className={`${input} mb-3`} rows={2} placeholder={zh ? "付款说明（可选）" : "Payment instructions (optional)"} value={f.instructions ?? ""} onChange={e => setF({ ...f, instructions: e.target.value })} />
      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{zh ? "保存" : "Save"}
      </button>
    </div>
  );
}
