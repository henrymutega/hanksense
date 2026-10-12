import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserRound, Check, X, Loader2 } from "lucide-react";

type Req = { id: string; user_id: string; amount_cny: number; slots: number; note: string | null; status: string; created_at: string };
type Profile = { id: string; full_name: string | null; email: string | null };

/** Admin panel: confirm ¥20 payments from individual (CV Coach) users. */
export function AdminIndividualTopUps() {
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith("zh");
  const [rows, setRows] = useState<Req[]>([]);
  const [people, setPeople] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("individual_topup_requests").select("*").order("created_at", { ascending: false });
    const list = (data as Req[]) ?? [];
    setRows(list);
    const ids = Array.from(new Set(list.map(r => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, Profile> = {};
      ((profs as Profile[]) ?? []).forEach(p => { map[p.id] = p; });
      setPeople(map);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function review(id: string, approve: boolean) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_individual_topup", { _request: id, _approve: approve });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(approve ? (zh ? "已确认，已增加 1 次" : "Payment confirmed — 1 job added") : (zh ? "已拒绝" : "Request declined"));
    load();
  }

  const pending = rows.filter(r => r.status === "pending").length;
  const revenue = rows.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.amount_cny || 0), 0);

  return (
    <div className="bg-card border border-border rounded-xl mt-6">
      <div className="p-4 border-b border-border flex items-center gap-2 flex-wrap">
        <UserRound className="w-4 h-4 text-primary" />
        <div>
          <div className="font-semibold text-sm">{zh ? "个人用户充值（简历教练）" : "Individual top-ups (CV Coach)"}</div>
          <div className="text-xs text-muted-foreground">{zh ? "收到 ¥20 或 380 KES 后确认，为用户增加 5 次职位分析。" : "Confirm once ¥20 or KES 380 is received to add 5 job analyses."}</div>
        </div>
        <div className="ml-auto flex gap-4 text-xs">
          <div><span className="text-muted-foreground">{zh ? "待处理" : "Pending"}: </span><b>{pending}</b></div>
          <div><span className="text-muted-foreground">{zh ? "收入" : "Revenue"}: </span><b>¥{revenue.toLocaleString()}</b></div>
        </div>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> …</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">{zh ? "暂无申请" : "No requests yet"}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{people[r.user_id]?.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{people[r.user_id]?.email}</div>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">¥{Number(r.amount_cny)}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[220px] truncate">{r.note || "—"}</td>
                  <td className="p-3 text-center text-xs">{new Date(r.created_at).toLocaleDateString(i18n.language)}</td>
                  <td className="p-3 text-center"><span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted">{r.status}</span></td>
                  <td className="p-3">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <button disabled={busy === r.id} onClick={() => review(r.id, true)} className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded disabled:opacity-50"><Check className="w-3 h-3" />{zh ? "确认收款" : "Confirm paid"}</button>
                        <button disabled={busy === r.id} onClick={() => review(r.id, false)} className="inline-flex items-center gap-1 text-xs border border-border px-2 py-1 rounded hover:bg-accent disabled:opacity-50"><X className="w-3 h-3" />{zh ? "拒绝" : "Decline"}</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
