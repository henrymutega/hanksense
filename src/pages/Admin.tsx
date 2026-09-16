
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useEffect, useMemo, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, GraduationCap, School, CalendarDays, CheckCircle2, XCircle, DollarSign, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { accessEnd, accessActive, daysLeft as daysLeftOf } from "@/lib/billing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";





const SEMESTER_PRICE = 600; // ¥600 per 90-day access period

type BillingRow = { status: string; semester_ends_at: string; activated_at?: string | null };

/** End of the access period (90d active / 7d trial), anchored on the activation date. */
function periodEnd(b?: BillingRow) {
  return accessEnd(b);
}
function daysLeft(r: { billing?: BillingRow }) {
  return daysLeftOf(r.billing);
}
function billingActive(r: { billing?: BillingRow }) {
  return accessActive(r.billing);
}



type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  institution: string | null;
  department: string | null;
  account_status: "pending" | "approved" | "suspended";
  billing?: BillingRow;

  classes: number;
  students: number;
};

function Stat({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider"><Icon className="w-4 h-4" />{label}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function AdminPage() {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "suspended">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [studentsByLecturer, setStudentsByLecturer] = useState<Record<string, Array<{ id: string; full_name: string | null; email: string | null; class_name: string; jobs: number; candidates: number }>>>({});

  async function load() {
    const { data: lecturers } = await supabase.from("user_roles").select("user_id").eq("role", "lecturer");
    const ids = (lecturers || []).map((r: any) => r.user_id);
    const { data: students } = await supabase.from("user_roles").select("user_id", { count: "exact", head: false }).eq("role", "student");
    setStudentCount(students?.length || 0);
    const { count: sCount } = await supabase.from("sessions").select("*", { count: "exact", head: true });
    setSessionCount(sCount || 0);

    if (!ids.length) { setRows([]); return; }
    const [{ data: profiles }, { data: billing }, { data: classes }, { data: mems }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, institution, department, account_status").in("id", ids),
      supabase.from("lecturer_billing").select("*").in("lecturer_id", ids),
      supabase.from("classes").select("id, lecturer_id").in("lecturer_id", ids),
      supabase.from("class_memberships").select("class_id"),
    ]);
    const classByLecturer: Record<string, number> = {};
    const classIdsByLecturer: Record<string, string[]> = {};
    (classes || []).forEach((c: any) => {
      classByLecturer[c.lecturer_id] = (classByLecturer[c.lecturer_id] || 0) + 1;
      (classIdsByLecturer[c.lecturer_id] ||= []).push(c.id);
    });
    const memCountByClass: Record<string, number> = {};
    (mems || []).forEach((m: any) => { memCountByClass[m.class_id] = (memCountByClass[m.class_id] || 0) + 1; });
    setRows((profiles || []).map((p: any) => ({
      ...p,
      billing: (billing || []).find((b: any) => b.lecturer_id === p.id),
      classes: classByLecturer[p.id] || 0,
      students: (classIdsByLecturer[p.id] || []).reduce((sum, cid) => sum + (memCountByClass[cid] || 0), 0),
    })));
  }
  useEffect(() => { if (role === "admin") load(); }, [role]);

  async function setStatus(lecturer_id: string, status: "approved" | "suspended" | "pending") {
    const { error } = await supabase.rpc("set_lecturer_status", { _lecturer: lecturer_id, _status: status });
    if (error) toast.error(error.message); else { toast.success(`Marked ${status}`); load(); }
  }
  async function setBilling(lecturer_id: string, mode: "trial" | "active" | "inactive" | "suspended") {
    const { error } = await supabase.rpc("admin_set_lecturer_billing", { _lecturer: lecturer_id, _mode: mode });
    if (error) { toast.error(error.message); return; }
    toast.success(
      mode === "trial" ? "Trial started — 7 days of access"
      : mode === "active" ? "Activated — 90 days of access"
      : mode === "inactive" ? "Access deactivated"
      : "Lecturer suspended"
    );
    load();
  }



  async function toggleStudents(lecturer_id: string) {
    setExpanded(e => ({ ...e, [lecturer_id]: !e[lecturer_id] }));
    if (studentsByLecturer[lecturer_id]) return;
    const { data: klasses } = await supabase.from("classes").select("id, name, course_code").eq("lecturer_id", lecturer_id);
    const classIds = (klasses || []).map((k: any) => k.id);
    if (!classIds.length) { setStudentsByLecturer(prev => ({ ...prev, [lecturer_id]: [] })); return; }
    const classNameById: Record<string, string> = {};
    (klasses || []).forEach((k: any) => { classNameById[k.id] = `${k.course_code ? k.course_code + " · " : ""}${k.name}`; });
    const [{ data: mems }, { data: jobs }, { data: cands }] = await Promise.all([
      supabase.from("class_memberships").select("class_id, student_id").in("class_id", classIds),
      supabase.from("session_jobs").select("id, created_by, class_id").in("class_id", classIds),
      supabase.from("session_candidates").select("job_id, class_id").in("class_id", classIds),
    ]);
    const memberRows = ((mems as any[]) || []);
    const studentIds = Array.from(new Set(memberRows.map(m => m.student_id).filter(Boolean)));
    const profById: Record<string, any> = {};
    if (studentIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", studentIds);
      ((profs as any[]) || []).forEach(p => { profById[p.id] = p; });
    }
    const jobsByUserClass: Record<string, string[]> = {};
    (jobs || []).forEach((j: any) => { const k = `${j.created_by}::${j.class_id}`; (jobsByUserClass[k] ||= []).push(j.id); });
    const candsByJob: Record<string, number> = {};
    (cands || []).forEach((c: any) => { candsByJob[c.job_id] = (candsByJob[c.job_id] || 0) + 1; });
    const rows = memberRows.map(m => {
      const p = profById[m.student_id] ?? { id: m.student_id, full_name: null, email: null };
      const myJobs = jobsByUserClass[`${p.id}::${m.class_id}`] || [];
      return { id: p.id, full_name: p.full_name, email: p.email, class_name: classNameById[m.class_id] || "—", jobs: myJobs.length, candidates: myJobs.reduce((s, jid) => s + (candsByJob[jid] || 0), 0) };
    });
    setStudentsByLecturer(prev => ({ ...prev, [lecturer_id]: rows }));
  }


  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter(r => r.account_status === "pending").length;
    const approved = rows.filter(r => r.account_status === "approved").length;
    const suspended = rows.filter(r => r.account_status === "suspended").length;
    const active = rows.filter(r => billingActive(r)).length;
    const expired = rows.filter(r => !billingActive(r)).length;
    const expiring = rows.filter(r => billingActive(r) && daysLeft(r) <= 14).length;
    const revenue = active * SEMESTER_PRICE;

    return { total, pending, approved, suspended, active, expired, expiring, revenue };

  }, [rows]);

  const visible = rows.filter(r => filter === "all" || r.account_status === filter);

  if (role !== "admin") return <div><PageHeader title={t("nav.adminGroup")} subtitle={t("admin.subtitle")} /></div>;

  return (
    <div>
      <PageHeader title={t("admin.title")} subtitle={t("admin.subtitle")} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Users} label={t("admin.stats.lecturers")} value={stats.total} sub={`${t("admin.stats.pendingApproval", { n: stats.pending })} · ${stats.approved} ${t("admin.filters.approved").toLowerCase()}`} />
        <Stat icon={GraduationCap} label={t("admin.stats.students")} value={studentCount} />
        <Stat icon={School} label={t("admin.stats.classes")} value={rows.reduce((s, r) => s + r.classes, 0)} />
        <Stat icon={CalendarDays} label={t("admin.stats.sessions")} value={sessionCount} />
        <Stat icon={CheckCircle2} label={t("billing.status")} value={stats.active} sub={`90-day access running · ${stats.expiring} ending ≤14d`} />
        <Stat icon={XCircle} label="Expired access" value={stats.expired} sub="No active 90-day period" />
        <Stat icon={DollarSign} label={t("billing.title")} value={`¥${stats.revenue.toLocaleString()}`} sub={`${stats.active} × ¥${SEMESTER_PRICE} / 90 days`} />
        <Stat icon={Users} label={t("admin.filters.suspended")} value={stats.suspended} />
      </div>


      <div className="flex gap-2 mb-3 text-xs">
        {(["all", "pending", "approved", "suspended"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md border ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
            {t(`admin.filters.${f}` as any)} {f !== "all" && `(${rows.filter(r => r.account_status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">{t("admin.lecturer")}</th>
              <th className="text-left p-3">{t("admin.institution")}</th>
              <th className="p-3">{t("admin.account")}</th>
              <th className="p-3">{t("admin.classes")}</th>
              <th className="p-3">{t("admin.students")}</th>
              <th className="p-3">{t("admin.billingCol")}</th>
              <th className="p-3">Activated</th>
              <th className="p-3">{t("admin.ends")}</th>

              <th className="p-3">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <Fragment key={r.id}>
              <tr className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-start gap-2">
                    <button onClick={() => toggleStudents(r.id)} className="mt-1 text-muted-foreground hover:text-primary" aria-label={t("admin.students")}>
                      {expanded[r.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    <Link to="/admin/lecturers/$id" params={{ id: r.id }} className="hover:text-primary">
                      <div className="font-medium">{r.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </Link>
                  </div>
                </td>

                <td className="p-3 text-xs text-muted-foreground">{[r.institution, r.department].filter(Boolean).join(" · ") || "—"}</td>
                <td className="p-3 text-center">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                    r.account_status === "approved" ? "bg-emerald-500/15 text-emerald-500" :
                    r.account_status === "pending" ? "bg-amber-500/15 text-amber-500" :
                    "bg-destructive/15 text-destructive"
                  }`}>{t(`admin.filters.${r.account_status}` as any)}</span>
                </td>
                <td className="p-3 text-center">{r.classes}</td>
                <td className="p-3 text-center">{r.students}</td>
                <td className="p-3 text-center text-xs uppercase tracking-wider">{billingActive(r) ? (r.billing?.status || "—") : "expired"}</td>
                <td className="p-3 text-center text-xs">
                  {r.billing?.activated_at ? new Date(r.billing.activated_at).toLocaleDateString(i18n.language) : "—"}
                </td>
                <td className="p-3 text-center text-xs">
                  {periodEnd(r.billing)?.toLocaleDateString(i18n.language) ?? "—"}
                  {billingActive(r)
                    ? <div className={`text-[10px] ${daysLeft(r) <= 14 ? "text-amber-500" : "text-muted-foreground"}`}>{daysLeft(r)}d left</div>
                    : <div className="text-[10px] text-destructive">expired</div>}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {r.account_status !== "approved" && (
                      <button onClick={() => setStatus(r.id, "approved")} className="text-xs bg-emerald-500/15 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-500/25 whitespace-nowrap">
                        {t("admin.approve")}
                      </button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-accent whitespace-nowrap">
                          {t("admin.billingSelect")} <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setBilling(r.id, "trial")} className="text-xs cursor-pointer">
                          <span className="w-2 h-2 rounded-full bg-sky-500 mr-2" />{t("admin.trial7d")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setBilling(r.id, "active")} className="text-xs cursor-pointer">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />{t("admin.activate90d")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setBilling(r.id, "inactive")} className="text-xs cursor-pointer">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground mr-2" />{t("admin.deactivate")}
                        </DropdownMenuItem>
                        {r.account_status !== "suspended" && (
                          <DropdownMenuItem onClick={() => setBilling(r.id, "suspended")} className="text-xs cursor-pointer text-destructive focus:text-destructive">
                            <span className="w-2 h-2 rounded-full bg-destructive mr-2" />{t("admin.suspend")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>

              </tr>
              {expanded[r.id] && (
                <tr className="border-t border-border/50 bg-muted/20">
                  <td colSpan={9} className="p-3">
                    {!studentsByLecturer[r.id] ? (
                      <div className="text-xs text-muted-foreground">Loading students…</div>
                    ) : studentsByLecturer[r.id].length === 0 ? (
                      <div className="text-xs text-muted-foreground">No students enrolled in this lecturer's classes.</div>
                    ) : (
                      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-xs">
                        <thead className="text-muted-foreground uppercase">
                          <tr><th className="text-left py-1">Student</th><th className="text-left py-1">Email</th><th className="text-left py-1">Class</th><th className="py-1">Jobs</th><th className="py-1">Candidates</th></tr>
                        </thead>
                        <tbody>
                          {studentsByLecturer[r.id].map((s, i) => (
                            <tr key={`${s.id}-${i}`} className="border-t border-border/40">
                              <td className="py-1.5">{s.full_name || "—"}</td>
                              <td className="py-1.5 text-muted-foreground">{s.email}</td>
                              <td className="py-1.5">{s.class_name}</td>
                              <td className="py-1.5 text-center">{s.jobs}</td>
                              <td className="py-1.5 text-center">{s.candidates}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    )}
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
            {visible.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">{t("admin.empty")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPage;
