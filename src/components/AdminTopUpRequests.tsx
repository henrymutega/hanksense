import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Check, X, Loader2 } from "lucide-react";

type Req = {
  id: string;
  student_id: string;
  lecturer_id: string;
  amount_cny: number;
  slots: number;
  note: string | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
  reviewed_at: string | null;
};

type Profile = { id: string; full_name: string | null; email: string | null };

/** Admin panel: approve or decline student ¥20 job-post top-up requests. */
export function AdminTopUpRequests({ lecturerId }: { lecturerId?: string }) {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<Req[]>([]);
  const [people, setPeople] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("student_topup_requests").select("*").order("created_at", { ascending: false });
    if (lecturerId) q = q.eq("lecturer_id", lecturerId);
    const { data } = await q;
    const list = ((data as Req[]) ?? []);
    setRows(list);
    const ids = Array.from(new Set(list.flatMap(r => [r.student_id, r.lecturer_id])));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, Profile> = {};
      ((profs as Profile[]) ?? []).forEach(p => { map[p.id] = p; });
      setPeople(map);
    }
    setLoading(false);
  }, [lecturerId]);

  useEffect(() => { load(); }, [load]);

  async function review(id: string, approve: boolean) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_topup", { _request: id, _approve: approve });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(approve ? t("topup.approvedToast") : t("topup.declinedToast"));
    load();
  }

  const pending = rows.filter(r => r.status === "pending").length;
  const revenue = rows.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.amount_cny || 0), 0);

  const name = (id: string) => people[id]?.full_name || people[id]?.email || "—";

  return (
    <div className="bg-card border border-border rounded-xl mt-6">
      <div className="p-4 border-b border-border flex items-center gap-2 flex-wrap">
        <Coins className="w-4 h-4 text-primary" />
        <div>
          <div className="font-semibold text-sm">{t("topup.adminTitle")}</div>
          <div className="text-xs text-muted-foreground">{t("topup.adminSubtitle")}</div>
        </div>
        <div className="ml-auto flex gap-4 text-xs">
          <div><span className="text-muted-foreground">{t("topup.pendingCount")}: </span><b>{pending}</b></div>
          <div><span className="text-muted-foreground">{t("topup.revenue")}: </span><b>¥{revenue.toLocaleString()}</b></div>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> …</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">{t("topup.adminEmpty")}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">{t("topup.student")}</th>
                <th className="text-left p-3">{t("topup.lecturer")}</th>
                <th className="p-3">{t("topup.amount")}</th>
                <th className="text-left p-3">{t("topup.note")}</th>
                <th className="p-3">{t("topup.requested")}</th>
                <th className="p-3">{t("topup.status")}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{name(r.student_id)}</div>
                    <div className="text-xs text-muted-foreground">{people[r.student_id]?.email}</div>
                  </td>
                  <td className="p-3 text-xs">{name(r.lecturer_id)}</td>
                  <td className="p-3 text-center whitespace-nowrap">¥{Number(r.amount_cny).toLocaleString()} <span className="text-xs text-muted-foreground">/ {r.slots}</span></td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[220px] truncate">{r.note || "—"}</td>
                  <td className="p-3 text-center text-xs">{new Date(r.created_at).toLocaleDateString(i18n.language)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      r.status === "approved" ? "bg-emerald-500/15 text-emerald-500"
                      : r.status === "pending" ? "bg-amber-500/15 text-amber-500"
                      : "bg-destructive/15 text-destructive"}`}>{r.status}</span>
                  </td>
                  <td className="p-3">
                    {r.status === "pending" && (
                      <div className="flex items-center justify-end gap-1">
                        <button disabled={busy === r.id} onClick={() => review(r.id, true)} className="inline-flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-500/25 disabled:opacity-50 whitespace-nowrap">
                          <Check className="w-3 h-3" />{t("topup.approve")}
                        </button>
                        <button disabled={busy === r.id} onClick={() => review(r.id, false)} className="inline-flex items-center gap-1 text-xs border border-border px-2 py-1 rounded hover:bg-accent disabled:opacity-50 whitespace-nowrap">
                          <X className="w-3 h-3" />{t("topup.decline")}
                        </button>
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
