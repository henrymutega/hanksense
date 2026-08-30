import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Users, ChevronDown, ChevronRight } from "lucide-react";
import { useLecturerState } from "@/lib/lecturer";
import { useTranslation } from "react-i18next";



type Klass = { id: string; name: string; semester: string | null; course_code: string | null; academic_year: string | null; description: string | null };
type Invite = { id: string; class_id: string; code: string; uses: number; max_uses: number | null };

function randCode(n = 6) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
}

function ClassesPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const { canWrite } = useLecturerState();
  const [classes, setClasses] = useState<Klass[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Array<{ id: string; full_name: string | null; email: string | null; jobs: number; candidates: number }>>>({});
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    if (!user) return;
    const { data: cls } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
    setClasses((cls as Klass[]) || []);
    const { data: inv } = await supabase.from("class_invites").select("*");
    setInvites((inv as Invite[]) || []);
    const { data: mems } = await supabase.from("class_memberships").select("class_id");
    const counts: Record<string, number> = {};
    (mems || []).forEach((m: any) => { counts[m.class_id] = (counts[m.class_id] || 0) + 1; });
    setMembers(counts);
  }
  useEffect(() => { load(); }, [user]);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase.from("classes").insert({ name, semester, course_code: courseCode || null, academic_year: year || null, description: description || null, lecturer_id: user.id }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("class_invites").insert({ class_id: data!.id, code: randCode() });
    setName(""); setSemester(""); setCourseCode(""); setYear(""); setDescription("");
    toast.success(t("classes.created")); load();
  }
  async function newInvite(classId: string) {
    const { error } = await supabase.from("class_invites").insert({ class_id: classId, code: randCode() });
    if (error) toast.error(error.message); else { toast.success(t("classes.inviteCreated")); load(); }
  }
  async function deleteClass(id: string) {
    if (!confirm(t("classes.confirmDelete"))) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  function copy(text: string) { navigator.clipboard.writeText(text); toast.success(t("common.copied")); }

  async function toggleStudents(classId: string) {
    setExpanded(e => ({ ...e, [classId]: !e[classId] }));
    if (studentsByClass[classId]) return;
    const { data: mems } = await supabase
      .from("class_memberships")
      .select("student_id")
      .eq("class_id", classId);
    const ids = ((mems as any[]) || []).map(m => m.student_id).filter(Boolean);
    let list: any[] = [];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const byId: Record<string, any> = {};
      ((profs as any[]) || []).forEach(p => { byId[p.id] = p; });
      list = ids.map(sid => byId[sid] ?? { id: sid, full_name: null, email: null });
    }
    const [{ data: jobs }, { data: cands }] = await Promise.all([
      supabase.from("session_jobs").select("id, created_by").eq("class_id", classId).in("created_by", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("session_candidates").select("job_id").eq("class_id", classId),
    ]);
    const jobsByUser: Record<string, string[]> = {};
    (jobs || []).forEach((j: any) => { (jobsByUser[j.created_by] ||= []).push(j.id); });
    const candsByJob: Record<string, number> = {};
    (cands || []).forEach((c: any) => { candsByJob[c.job_id] = (candsByJob[c.job_id] || 0) + 1; });
    const rows = list.map((s: any) => {
      const myJobs = jobsByUser[s.id] || [];
      return { ...s, jobs: myJobs.length, candidates: myJobs.reduce((sum, jid) => sum + (candsByJob[jid] || 0), 0) };
    });
    setStudentsByClass(prev => ({ ...prev, [classId]: rows }));
  }

  if (role !== "lecturer" && role !== "admin") {
    return <div><PageHeader title={t("classes.title")} subtitle={t("classes.lecturerOnly")} /></div>;
  }

  return (
    <div>
      <PageHeader title={t("classes.title")} subtitle={t("classes.subtitle")} />

      {!canWrite && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3 mb-4">
          {t("classes.readOnly")} <Link to="/billing" className="underline font-medium">{t("classes.billingLink")}</Link> {t("classes.page")}
        </div>
      )}

      {canWrite && (
        <form onSubmit={createClass} className="bg-card border border-border rounded-xl p-4 mb-6 grid gap-2 md:grid-cols-[140px_1fr_160px_140px_auto] items-end">
          <div><label className="text-xs text-muted-foreground">{t("classes.courseCode")}</label><input value={courseCode} onChange={e => setCourseCode(e.target.value.toUpperCase())} placeholder="HRM402" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm uppercase" /></div>
          <div><label className="text-xs text-muted-foreground">{t("classes.courseName")}</label><input required value={name} onChange={e => setName(e.target.value)} placeholder="AI in Recruitment" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">{t("classes.semester")}</label><input value={semester} onChange={e => setSemester(e.target.value)} placeholder="Spring" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground">{t("classes.year")}</label><input value={year} onChange={e => setYear(e.target.value)} placeholder="2026" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" /></div>
          <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" />{t("classes.create")}</button>
          <div className="md:col-span-5"><label className="text-xs text-muted-foreground">{t("classes.description")}</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder={t("classes.descriptionPh")} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" /></div>
        </form>
      )}

      <div className="grid gap-4">
        {classes.map(c => {
          const cInvites = invites.filter(i => i.class_id === c.id);
          return (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link to="/classes/$id" params={{ id: c.id }} className="font-semibold hover:text-primary">{c.course_code ? `${c.course_code} · ` : ""}{c.name}</Link>
                  {c.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-xl">{c.description}</div>}
                  <div className="text-xs text-muted-foreground">{[c.semester, c.academic_year].filter(Boolean).join(" ") || "—"} · <Users className="w-3 h-3 inline" /> {members[c.id] || 0} {t("classes.students")}</div>
                </div>
                <div className="flex items-center gap-2">
                <Link to="/classes/$id" params={{ id: c.id }} className="text-xs border border-border rounded px-2.5 py-1.5 hover:bg-accent">{t("classes.openClass")}</Link>
                {canWrite && <button onClick={() => deleteClass(c.id)} className="text-destructive p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{t("classes.inviteCodes")}</div>
              <div className="space-y-1.5">
                {cInvites.map(i => (
                  <div key={i.id} className="flex items-center gap-2 text-sm bg-muted/40 rounded px-3 py-1.5">
                    <code className="font-mono font-semibold tracking-widest">{i.code}</code>
                    <span className="text-xs text-muted-foreground">{t("classes.used")} {i.uses}{i.max_uses ? `/${i.max_uses}` : ""}</span>
                    <button onClick={() => copy(`${window.location.origin}/join/${i.code}`)} className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"><Copy className="w-3 h-3" />{t("classes.copyLink")}</button>
                  </div>
                ))}
                {canWrite && <button onClick={() => newInvite(c.id)} className="text-xs text-primary hover:underline">{t("classes.newInvite")}</button>}
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <button onClick={() => toggleStudents(c.id)} className="text-xs font-medium flex items-center gap-1 text-foreground hover:text-primary">
                  {expanded[c.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Students & activity ({members[c.id] || 0})
                </button>
                {expanded[c.id] && (
                  <div className="mt-2">
                    {!studentsByClass[c.id] ? (
                      <div className="text-xs text-muted-foreground p-2">Loading…</div>
                    ) : studentsByClass[c.id].length === 0 ? (
                      <div className="text-xs text-muted-foreground p-2">No students have joined yet.</div>
                    ) : (
                      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
                        <thead className="text-xs uppercase text-muted-foreground">
                          <tr><th className="text-left py-1">Student</th><th className="text-left py-1">Email</th><th className="py-1">Jobs</th><th className="py-1">Candidates</th><th className="py-1">Quota</th></tr>
                        </thead>
                        <tbody>
                          {studentsByClass[c.id].map(s => (
                            <tr key={s.id} className="border-t border-border/50">
                              <td className="py-1.5">{s.full_name || "—"}</td>
                              <td className="py-1.5 text-muted-foreground">{s.email}</td>
                              <td className="py-1.5 text-center">{s.jobs}</td>
                              <td className="py-1.5 text-center">{s.candidates}</td>
                              <td className="py-1.5 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.jobs >= 3 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{s.jobs}/3</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {classes.length === 0 && <div className="text-sm text-muted-foreground text-center py-12">{t("classes.empty")}</div>}
      </div>
    </div>
  );
}

export default ClassesPage;
