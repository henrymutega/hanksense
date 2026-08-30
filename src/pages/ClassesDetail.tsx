import { Link, getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState, STUDENT_JOB_LIMIT } from "@/lib/lecturer";
import { toast } from "sonner";
import { ArrowLeft, Copy, KeyRound, Plus, Users, Briefcase, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

const Route = getRouteApi("/classes_/$id");



type Klass = {
  id: string; name: string; semester: string | null; course_code: string | null;
  academic_year: string | null; description: string | null; lecturer_id: string;
};
type Sess = { id: string; title: string; scheduled_at: string | null; status: string; join_code: string | null };
type JobRow = { id: string; title: string; session_id: string; created_by: string; status: string };
type StudentRow = { id: string; full_name: string | null; email: string | null; jobs: number; candidates: number; joined_at: string | null; titles: string[] };

type Tab = "overview" | "sessions" | "students" | "jobs";

function ClassDetailPage() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const { canWrite } = useLecturerState();
  const isLecturer = role === "lecturer" || role === "admin";

  const [tab, setTab] = useState<Tab>("overview");
  const [klass, setKlass] = useState<Klass | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [newSession, setNewSession] = useState("");
  const [when, setWhen] = useState("");

  const owns = !!klass && !!user && (klass.lecturer_id === user.id || role === "admin");

  async function load() {
    setLoading(true);
    const { data: c } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();
    setKlass((c as Klass) || null);

    const [{ data: inv }, { data: sess }, { data: jbs }, { data: mems }] = await Promise.all([
      supabase.from("class_invites").select("code").eq("class_id", id),
      supabase.from("sessions").select("id,title,scheduled_at,status,join_code").eq("class_id", id).order("scheduled_at", { ascending: false }),
      supabase.from("session_jobs").select("id,title,session_id,created_by,status").eq("class_id", id).order("created_at", { ascending: false }),
      supabase.from("class_memberships").select("student_id, joined_at").eq("class_id", id),
    ]);
    setCodes(((inv as any[]) || []).map(i => i.code));
    setSessions((sess as Sess[]) || []);
    const jobList = (jbs as JobRow[]) || [];
    setJobs(jobList);

    const memberRows = ((mems as any[]) || []);
    const studentIds = memberRows.map(m => m.student_id);
    const authorIds = Array.from(new Set([...jobList.map(j => j.created_by), ...studentIds, (c as any)?.lecturer_id].filter(Boolean)));
    const nameMap: Record<string, string> = {};
    let profiles: any[] = [];
    if (authorIds.length) {
      const { data: p } = await supabase.from("profiles").select("id, full_name, email").in("id", authorIds);
      profiles = p || [];
      profiles.forEach((p: any) => { nameMap[p.id] = p.full_name || p.email || "—"; });
    }
    setAuthors(nameMap);

    if (studentIds.length) {
      const { data: cands } = await supabase.from("session_candidates").select("job_id").eq("class_id", id);
      const candsByJob: Record<string, number> = {};
      ((cands as any[]) || []).forEach(c2 => { candsByJob[c2.job_id] = (candsByJob[c2.job_id] || 0) + 1; });
      setStudents(memberRows.map(m => {
        const sid = m.student_id;
        const prof = profiles.find((p: any) => p.id === sid);
        const my = jobList.filter(j => j.created_by === sid);
        return {
          id: sid,
          full_name: prof?.full_name ?? null,
          email: prof?.email ?? null,
          jobs: my.length,
          candidates: my.reduce((s, j) => s + (candsByJob[j.id] || 0), 0),
          joined_at: m.joined_at ?? null,
          titles: my.map(j => j.title),
        };
      }));
    } else setStudents([]);
    setLoading(false);
  }
  useEffect(() => { load(); }, [id, user?.id]);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const rand = Array.from({ length: 5 }, () => a[Math.floor(Math.random() * a.length)]).join("");
    const prefix = (klass?.course_code || klass?.name?.split(" ")[0] || "S").toUpperCase();
    const code = `${prefix}-${rand}${String(new Date().getFullYear()).slice(2)}`;
    const { error } = await supabase.from("sessions").insert({ class_id: id, title: newSession, scheduled_at: when || null, join_code: code });
    if (error) return toast.error(error.message);
    setNewSession(""); setWhen("");
    toast.success(t("classDetail.sessionCreated"));
    load();
  }

  function copy(text: string) { navigator.clipboard.writeText(text); toast.success(t("common.copied")); }

  if (loading) return <div className="text-sm text-muted-foreground py-10 text-center">{t("common.loading")}</div>;
  if (!klass) return <div className="text-sm text-muted-foreground py-10 text-center">{t("classDetail.notFound")}</div>;

  const lecturerName = authors[klass.lecturer_id] || "—";
  const tabs: Tab[] = owns || isLecturer ? ["overview", "sessions", "students", "jobs"] : ["overview", "sessions", "jobs"];

  return (
    <div>
      <Link to="/classes" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"><ArrowLeft className="w-3 h-3" /> {t("classDetail.backToClasses")}</Link>
      <PageHeader
        title={`${klass.course_code ? klass.course_code + " · " : ""}${klass.name}`}
        subtitle={`${[klass.semester, klass.academic_year].filter(Boolean).join(" ") || "—"} · ${t("classDetail.lecturer")}: ${lecturerName}`}
      />

      <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
        {tabs.map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${tab === tb ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t(`classDetail.tabs.${tb}`)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="bg-card border border-border rounded-xl p-4 md:col-span-2">
            <div className="text-xs uppercase text-muted-foreground mb-1">{t("classDetail.description")}</div>
            <p className="text-sm">{klass.description || t("classDetail.noDescription")}</p>
            {codes.length > 0 && (
              <div className="mt-4">
                <div className="text-xs uppercase text-muted-foreground mb-1">{t("classDetail.classCode")}</div>
                <div className="flex flex-wrap gap-2">
                  {codes.map(code => (
                    <span key={code} className="flex items-center gap-2 bg-muted/40 rounded px-2.5 py-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      <code className="font-mono font-semibold tracking-widest text-xs">{code}</code>
                      <button onClick={() => copy(code)} className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-3">
            <Stat icon={<Users className="w-4 h-4" />} label={t("classDetail.students")} value={students.length} />
            <Stat icon={<CalendarDays className="w-4 h-4" />} label={t("classDetail.sessions")} value={sessions.length} />
            <Stat icon={<Briefcase className="w-4 h-4" />} label={t("classDetail.jobs")} value={jobs.length} />
          </div>
        </div>
      )}

      {tab === "sessions" && (
        <div className="grid gap-2">
          {owns && canWrite && (
            <form onSubmit={createSession} className="bg-card border border-border rounded-xl p-3 grid gap-2 md:grid-cols-[1fr_200px_auto] mb-2">
              <input required value={newSession} onChange={e => setNewSession(e.target.value)} placeholder={t("classDetail.sessionTitlePh")} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm flex items-center gap-1"><Plus className="w-4 h-4" />{t("classDetail.addSession")}</button>
            </form>
          )}
          {sessions.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-xs text-muted-foreground">
                  {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString(i18n.language) : t("classDetail.anytime")} · <span className="uppercase tracking-wider">{s.status}</span> · {jobs.filter(j => j.session_id === s.id).length} {t("classDetail.jobs")}
                </div>
              </div>
              {owns && s.join_code && (
                <span className="flex items-center gap-2 bg-muted/40 rounded px-2.5 py-1.5">
                  <code className="font-mono font-semibold tracking-widest text-xs">{s.join_code}</code>
                  <button onClick={() => copy(s.join_code!)} className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                </span>
              )}
              <Link to="/sessions/$id" params={{ id: s.id }} className="text-xs border border-border rounded px-3 py-1.5 hover:bg-accent">{t("classDetail.open")}</Link>
            </div>
          ))}
          {sessions.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">{t("classDetail.noSessions")}</div>}
        </div>
      )}

      {tab === "students" && (
        <div className="grid gap-3">
          <div className="text-xs text-muted-foreground">{students.length} {t("classDetail.joinedCount")}</div>
          {students.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">{t("classDetail.noStudents")}</div>
          ) : students.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm font-medium">{s.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                  {s.joined_at && <div className="text-[11px] text-muted-foreground mt-0.5">{t("classDetail.joined")}: {new Date(s.joined_at).toLocaleDateString(i18n.language)}</div>}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center"><div className="text-base font-semibold leading-none">{s.jobs}</div><div className="text-muted-foreground mt-0.5">{t("classDetail.jobs")}</div></div>
                  <div className="text-center"><div className="text-base font-semibold leading-none">{s.candidates}</div><div className="text-muted-foreground mt-0.5">{t("classDetail.candidates")}</div></div>
                  <span className={`px-2 py-0.5 rounded ${s.jobs >= STUDENT_JOB_LIMIT ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{s.jobs}/{STUDENT_JOB_LIMIT}</span>
                </div>
              </div>
              <div className="mt-3 border-t border-border/50 pt-2">
                <div className="text-xs uppercase text-muted-foreground mb-1">{t("classDetail.postings")}</div>
                {s.titles.length === 0 ? (
                  <div className="text-xs text-muted-foreground">{t("classDetail.noStudentJobs")}</div>
                ) : (
                  <div className="grid gap-1">
                    {jobs.filter(j => j.created_by === s.id).map(j => (
                      <div key={j.id} className="flex items-center gap-2 text-sm">
                        <span>{j.title}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{j.status}</span>
                        <Link to="/pipeline" search={{ job: j.id }} className="ml-auto text-xs text-primary hover:underline">{t("classDetail.pipeline")}</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {tab === "jobs" && (
        <div className="grid gap-3">
          {sessions.map(s => {
            const list = jobs.filter(j => j.session_id === s.id);
            if (list.length === 0) return null;
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm font-semibold mb-2">{s.title}</div>
                <div className="grid gap-1.5">
                  {list.map(j => (
                    <div key={j.id} className="flex items-center gap-2 flex-wrap text-sm border-t border-border/50 pt-1.5">
                      <span className="font-medium">{j.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${j.created_by === klass.lecturer_id ? "bg-primary/15 text-primary" : "bg-muted"}`}>
                        {j.created_by === klass.lecturer_id ? t("classDetail.lecturer") : t("classDetail.student")}
                      </span>
                      <span className="text-xs text-muted-foreground">{authors[j.created_by] || "—"}</span>
                      <Link to="/pipeline" search={{ job: j.id }} className="ml-auto text-xs text-primary hover:underline">{t("classDetail.pipeline")}</Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {jobs.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">{t("classDetail.noJobs")}</div>}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <span className="text-primary">{icon}</span>
      <div>
        <div className="text-lg font-semibold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default ClassDetailPage;
