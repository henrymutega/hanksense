import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { STUDENT_JOB_LIMIT } from "@/lib/lecturer";
import { Users, Search, Mail, Phone, IdCard, Building2, CalendarDays, Briefcase, ChevronDown, ChevronRight } from "lucide-react";

export type StudentRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  student_id: string | null;
  institution: string | null;
  department: string | null;
  phone: string | null;
  joined_at: string | null;
  classes: { id: string; name: string; label: string }[];
  sessions: { id: string; title: string; class_id: string; scheduled_at: string | null; status: string }[];
  jobs: { id: string; title: string; status: string; class_id: string; session_id: string; created_at: string }[];
  candidates: number;
  hired: number;
};

/**
 * Full directory of students enrolled in the classes of one lecturer
 * (or of the signed-in lecturer when `lecturerId` is omitted).
 */
export function StudentsDirectory({ lecturerId }: { lecturerId?: string }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let cq = supabase.from("classes").select("id, name, course_code, semester, lecturer_id");
      if (lecturerId) cq = cq.eq("lecturer_id", lecturerId);
      const { data: klasses } = await cq;
      const classIds = (klasses ?? []).map((c: any) => c.id);
      if (!classIds.length) {
        if (!cancelled) { setStudents([]); setLoading(false); }
        return;
      }
      const classById: Record<string, any> = {};
      (klasses ?? []).forEach((c: any) => { classById[c.id] = c; });

      const [{ data: mems }, { data: sessions }, { data: jobs }, { data: cands }] = await Promise.all([
        supabase.from("class_memberships").select("class_id, student_id, joined_at").in("class_id", classIds),
        supabase.from("sessions").select("id, title, class_id, scheduled_at, status").in("class_id", classIds),
        supabase.from("session_jobs").select("id, title, status, class_id, session_id, created_by, created_at").in("class_id", classIds),
        supabase.from("session_candidates").select("job_id, stage, class_id").in("class_id", classIds),
      ]);

      const memberRows = (mems as any[]) ?? [];
      const studentIds = Array.from(new Set(memberRows.map(m => m.student_id).filter(Boolean)));
      const profById: Record<string, any> = {};
      if (studentIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email, student_id, institution, department, phone")
          .in("id", studentIds);
        ((profs as any[]) ?? []).forEach(p => { profById[p.id] = p; });
      }

      const sessionIds = ((sessions as any[]) ?? []).map(s => s.id);
      let partRows: any[] = [];
      if (sessionIds.length) {
        const { data: parts } = await supabase
          .from("session_participants")
          .select("session_id, student_id")
          .in("session_id", sessionIds);
        partRows = (parts as any[]) ?? [];
      }
      const sessionById: Record<string, any> = {};
      ((sessions as any[]) ?? []).forEach(s => { sessionById[s.id] = s; });

      const candByJob: Record<string, { total: number; hired: number }> = {};
      ((cands as any[]) ?? []).forEach(c => {
        const e = (candByJob[c.job_id] ||= { total: 0, hired: 0 });
        e.total += 1;
        if (c.stage === "hired") e.hired += 1;
      });

      const byStudent = new Map<string, StudentRecord>();
      memberRows.forEach(m => {
        const p = profById[m.student_id] ?? {};
        const rec: StudentRecord = byStudent.get(m.student_id) ?? {
          id: m.student_id,
          full_name: p.full_name ?? null,
          email: p.email ?? null,
          student_id: p.student_id ?? null,
          institution: p.institution ?? null,
          department: p.department ?? null,
          phone: p.phone ?? null,
          joined_at: m.joined_at ?? null,
          classes: [],
          sessions: [],
          jobs: [],
          candidates: 0,
          hired: 0,
        };
        const c = classById[m.class_id];
        if (c && !rec.classes.some(x => x.id === c.id)) {
          rec.classes.push({ id: c.id, name: c.name, label: `${c.course_code ? c.course_code + " · " : ""}${c.name}` });
        }
        if (m.joined_at && (!rec.joined_at || m.joined_at < rec.joined_at)) rec.joined_at = m.joined_at;
        byStudent.set(m.student_id, rec);
      });

      partRows.forEach(pr => {
        const rec = byStudent.get(pr.student_id);
        const s = sessionById[pr.session_id];
        if (rec && s && !rec.sessions.some(x => x.id === s.id)) rec.sessions.push(s);
      });

      ((jobs as any[]) ?? []).forEach(j => {
        const rec = byStudent.get(j.created_by);
        if (!rec) return;
        rec.jobs.push(j);
        const c = candByJob[j.id];
        if (c) { rec.candidates += c.total; rec.hired += c.hired; }
      });

      const list = Array.from(byStudent.values()).sort((a, b) =>
        (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""),
      );
      if (!cancelled) { setStudents(list); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [lecturerId]);

  const classOptions = useMemo(() => {
    const m = new Map<string, string>();
    students.forEach(s => s.classes.forEach(c => m.set(c.id, c.label)));
    return Array.from(m, ([id, label]) => ({ id, label }));
  }, [students]);

  const visible = students.filter(s => {
    if (classFilter !== "all" && !s.classes.some(c => c.id === classFilter)) return false;
    if (!q.trim()) return true;
    const hay = [s.full_name, s.email, s.student_id, s.department, s.institution].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const totals = useMemo(() => ({
    students: students.length,
    jobs: students.reduce((n, s) => n + s.jobs.length, 0),
    candidates: students.reduce((n, s) => n + s.candidates, 0),
    hired: students.reduce((n, s) => n + s.hired, 0),
  }), [students]);

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(i18n.language) : "—");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: t("students.stats.enrolled"), value: totals.students },
          { icon: Briefcase, label: t("students.stats.jobs"), value: totals.jobs },
          { icon: Users, label: t("students.stats.candidates"), value: totals.candidates },
          { icon: CalendarDays, label: t("students.stats.hired"), value: totals.hired },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider"><s.icon className="w-4 h-4" />{s.label}</div>
            <div className="text-2xl font-semibold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t("students.searchPlaceholder")}
            className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm">
          <option value="all">{t("students.allClasses")}</option>
          {classOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      ) : visible.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">{t("students.empty")}</div>
      ) : (
        <div className="space-y-3">
          {visible.map(s => {
            const expanded = !!open[s.id];
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpen(o => ({ ...o, [s.id]: !o[s.id] }))}
                  className="w-full flex flex-wrap items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                >
                  {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{s.full_name || t("students.unnamed")}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.email || "—"}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.classes.map(c => (
                      <span key={c.id} className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded">{c.label}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                    <span>{t("students.jobsShort")}: <b className="text-foreground">{s.jobs.length}/{STUDENT_JOB_LIMIT}</b></span>
                    <span>{t("students.candidatesShort")}: <b className="text-foreground">{s.candidates}</b></span>
                    <span>{t("students.sessionsShort")}: <b className="text-foreground">{s.sessions.length}</b></span>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-border p-4 grid gap-4 md:grid-cols-3 text-sm">
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("students.details")}</div>
                      <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{s.email || "—"}</div>
                      <div className="flex items-center gap-2"><IdCard className="w-3.5 h-3.5 text-muted-foreground" />{s.student_id || "—"}</div>
                      <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{s.phone || "—"}</div>
                      <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{[s.institution, s.department].filter(Boolean).join(" · ") || "—"}</div>
                      <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />{t("students.joinedOn", { date: fmt(s.joined_at) })}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("students.sessions")}</div>
                      {s.sessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("students.noSessions")}</p>
                      ) : (
                        <ul className="space-y-1">
                          {s.sessions.map(se => (
                            <li key={se.id}>
                              <Link to="/sessions/$id" params={{ id: se.id }} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 hover:border-primary hover:bg-accent transition-colors">
                                <span className="truncate text-xs">{se.title}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{fmt(se.scheduled_at)}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("students.jobs")}</div>
                      {s.jobs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("students.noJobs")}</p>
                      ) : (
                        <ul className="space-y-1">
                          {s.jobs.map(j => (
                            <li key={j.id}>
                              <Link to="/pipeline" search={{ job: j.id }} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 hover:border-primary hover:bg-accent transition-colors">
                                <span className="truncate text-xs">{j.title}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{j.status}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
