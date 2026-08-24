import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLecturerState } from "@/lib/lecturer";
import type { SessionJob } from "@/lib/session-jobs";
import { Briefcase, Sparkles, Trash2, Users, MapPin, Lock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";



type Row = SessionJob & {
  _class?: string;
  _session?: string;
  _candidates?: number;
  _authorName?: string;
  _authorIsLecturer?: boolean;
};

// scope options
type Scope = "all" | "mine" | "lecturer" | "students" | string; // string = specific student id

function JobsPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const { canWrite } = useLecturerState();
  const isLecturer = role === "lecturer" || role === "admin";
  const isStudent = role === "student";
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>(isStudent ? "mine" : "all");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("session_jobs" as any)
      .select("*, classes(name, course_code, lecturer_id), sessions(title), session_candidates(id)")
      .order("created_at", { ascending: false });
    const list = (data as any[]) || [];
    const authorIds = Array.from(new Set(list.map(j => j.created_by).filter(Boolean)));
    let authors: Record<string, { full_name?: string; email?: string }> = {};
    if (authorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", authorIds);
      (profs || []).forEach((p: any) => { authors[p.id] = p; });
    }
    const mapped: Row[] = list.map(j => ({
      ...j,
      _class: j.classes ? (j.classes.course_code ? `${j.classes.course_code} · ${j.classes.name}` : j.classes.name) : "—",
      _session: j.sessions?.title || "—",
      _candidates: j.session_candidates?.length ?? 0,
      _authorName: authors[j.created_by]?.full_name || authors[j.created_by]?.email || "Unknown",
      _authorIsLecturer: !!j.classes && j.created_by === j.classes.lecturer_id,
    }));
    setRows(mapped);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  async function close(j: Row) {
    await supabase.from("session_jobs" as any).update({ status: j.status === "closed" ? "posted" : "closed" }).eq("id", j.id);
    toast.success(j.status === "closed" ? t("jobs.reopened") : t("jobs.closed")); load();
  }
  async function del(j: Row) {
    if (!confirm(t("jobs.confirmDelete", { title: j.title }))) return;
    const { error } = await supabase.from("session_jobs" as any).delete().eq("id", j.id);
    if (error) toast.error(error.message); else { toast.success(t("jobs.deleted")); load(); }
  }

  const canCreate = isLecturer || isStudent;

  // Distinct student authors for lecturer filter
  const studentAuthors = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(r => {
      if (!r._authorIsLecturer && (r as any).created_by) {
        map.set((r as any).created_by, r._authorName || "Student");
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const visible = useMemo(() => {
    if (isStudent) {
      // Students only ever see: their own OR their lecturer's postings
      const base = rows.filter(r => (r as any).created_by === user?.id || r._authorIsLecturer);
      if (scope === "mine") return base.filter(r => (r as any).created_by === user?.id);
      if (scope === "lecturer") return base.filter(r => r._authorIsLecturer);
      return base; // "all" (of what they're allowed)
    }
    // Lecturer / admin
    if (scope === "mine") return rows.filter(r => (r as any).created_by === user?.id);
    if (scope === "students") return rows.filter(r => !r._authorIsLecturer);
    if (scope === "lecturer") return rows.filter(r => r._authorIsLecturer);
    if (scope !== "all") return rows.filter(r => (r as any).created_by === scope); // specific student
    return rows;
  }, [rows, scope, isStudent, user?.id]);

  return (
    <div>
      <PageHeader
        title={t("jobs.title")}
        subtitle={isLecturer ? t("jobs.subtitleLecturer") : t("jobs.subtitleStudent")}
        actions={canCreate && (
          <Link to="/ai-jobs" className="text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> {t("jobs.createWithAI")}
          </Link>
        )}
      />

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
        <label className="text-xs text-muted-foreground">Show:</label>
        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
        >
          {isStudent ? (
            <>
              <option value="mine">My postings</option>
              <option value="lecturer">From my lecturer</option>
              <option value="all">All I can see</option>
            </>
          ) : (
            <>
              <option value="all">All jobs</option>
              <option value="mine">My postings</option>
              <option value="lecturer">Lecturer-posted</option>
              <option value="students">All student-posted</option>
              {studentAuthors.length > 0 && <optgroup label="By student">
                {studentAuthors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>}
            </>
          )}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{visible.length} job{visible.length === 1 ? "" : "s"}</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">{t("jobs.loading")}</div>
      ) : visible.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {canCreate ? <>{t("jobs.noneLecturer")} <Link to="/ai-jobs" className="text-primary hover:underline">{t("jobs.createFirst")}</Link></> : t("jobs.noneStudent")}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {visible.map(j => {
            const ownsJob = !!user && (j as any).created_by === user.id;
            const canManage = isLecturer || ownsJob;
            return (
            <div key={j.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-semibold flex items-center gap-2">{j.title}
                    {j.status === "closed" && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase">{t("jobs.closedTag")}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{j._class} → {j._session}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    By <span className="font-medium text-foreground">{j._authorName}</span>
                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded ${j._authorIsLecturer ? "bg-primary/15 text-primary" : "bg-muted"}`}>
                      {j._authorIsLecturer ? "Lecturer" : "Student"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{j.department || "—"} · <MapPin className="w-3 h-3 inline" /> {j.location || "—"} · {j.work_mode}</div>
                </div>
                <span className="text-xs flex items-center gap-1 bg-muted px-2 py-0.5 rounded"><Users className="w-3 h-3" />{j._candidates}</span>
              </div>
              {j.summary && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{j.summary}</p>}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {j.required_skills.slice(0, 6).map(s => <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{s}</span>)}
              </div>
              <div className="flex gap-2 flex-wrap">
                {canManage ? (
                  <>
                    <button onClick={() => nav({ to: "/screening", search: { job: j.id } as any })} className="text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded hover:bg-primary hover:text-primary-foreground">{t("jobs.uploadCVs")}</button>
                    <Link to="/pipeline" search={{ job: j.id } as any} className="text-xs border border-border px-2.5 py-1.5 rounded hover:bg-accent">{t("jobs.pipeline")}</Link>
                    <button onClick={() => close(j)} disabled={!canWrite} className="text-xs border border-border px-2.5 py-1.5 rounded hover:bg-accent disabled:opacity-50">{j.status === "closed" ? t("jobs.reopen") : t("jobs.close")}</button>
                    <button onClick={() => del(j)} disabled={!canWrite} className="text-xs border border-border px-2.5 py-1.5 rounded hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"><Trash2 className="w-3 h-3" /></button>
                  </>
                ) : (
                  <Link to="/pipeline" search={{ job: j.id } as any} className="text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded">{t("jobs.viewCandidates")}</Link>
                )}
                {!canWrite && canManage && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> {t("common.readOnly")}</span>}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

export default JobsPage;
