import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Play, Copy, KeyRound } from "lucide-react";
import { useLecturerState } from "@/lib/lecturer";
import { useTranslation } from "react-i18next";



type Session = { id: string; class_id: string; title: string; scheduled_at: string | null; status: string; join_code: string | null };
type Klass = { id: string; name: string; course_code: string | null };

function genCode(prefix?: string | null) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from({ length: 5 }, () => a[Math.floor(Math.random() * a.length)]).join("");
  const yr = new Date().getFullYear();
  return prefix ? `${prefix.toUpperCase()}-${rand}${String(yr).slice(2)}` : `S-${rand}${String(yr).slice(2)}`;
}

function SessionsPage() {
  const { t, i18n } = useTranslation();
  const { user, role } = useAuth();
  const lect = useLecturerState();
  const isLecturer = role === "lecturer" || role === "admin";
  const canWrite = lect.canWrite;
  const [classes, setClasses] = useState<Klass[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [when, setWhen] = useState("");

  async function load() {
    if (!user) return;
    if (isLecturer) {
      const { data: cls } = await supabase.from("classes").select("id,name,course_code");
      setClasses((cls as Klass[]) || []);
      if (cls && cls.length && !classId) setClassId(cls[0].id);
    } else {
      const { data: mems } = await supabase.from("class_memberships").select("class_id, classes(id,name,course_code)");
      const cls: Klass[] = (mems || []).map((m: any) => m.classes).filter(Boolean);
      setClasses(cls);
    }
    const { data: sess } = await supabase.from("sessions").select("*").order("scheduled_at", { ascending: false });
    setSessions((sess as Session[]) || []);
  }
  useEffect(() => { load(); }, [user, role]);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) return toast.error(t("sessions.pickClassErr"));
    const cls = classes.find(c => c.id === classId);
    const code = genCode(cls?.course_code || cls?.name?.split(" ")[0]);
    const { error } = await supabase.from("sessions").insert({ class_id: classId, title, scheduled_at: when || null, join_code: code });
    if (error) toast.error(error.message);
    else { setTitle(""); setWhen(""); toast.success(t("sessions.created", { code })); load(); }
  }
  async function start(id: string) {
    await supabase.from("sessions").update({ status: "live" }).eq("id", id);
    load();
  }
  async function regen(s: Session) {
    const cls = classes.find(c => c.id === s.class_id);
    const code = genCode(cls?.course_code || cls?.name?.split(" ")[0]);
    const { error } = await supabase.from("sessions").update({ join_code: code }).eq("id", s.id);
    if (error) toast.error(error.message); else { toast.success(t("sessions.newCodeGenerated")); load(); }
  }
  function copy(text: string) { navigator.clipboard.writeText(text); toast.success(t("sessions.copied")); }

  return (
    <div>
      <PageHeader title={t("sessions.title")} subtitle={isLecturer ? t("sessions.subtitleLecturer") : t("sessions.subtitleStudent")} />
      {isLecturer && !canWrite && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3 mb-4">
          {t("sessions.subInactive")} <Link to="/billing" className="underline font-medium">{t("sessions.billing")}</Link> {t("sessions.page")}
        </div>
      )}
      {isLecturer && canWrite && (
        <form onSubmit={createSession} className="bg-card border border-border rounded-xl p-4 mb-6 grid gap-2 md:grid-cols-[1fr_200px_200px_auto]">
          <input required placeholder={t("sessions.titlePh")} value={title} onChange={e => setTitle(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <select value={classId} onChange={e => setClassId(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm">
            <option value="">{t("sessions.pickClass")}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" />{t("sessions.create")}</button>
        </form>
      )}

      <div className="grid gap-2">
        {sessions.map(s => {
          const cls = classes.find(c => c.id === s.class_id);
          return (
            <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground">{cls?.name || "—"} · {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString(i18n.language) : t("sessions.anytime")} · <span className="uppercase tracking-wider">{s.status}</span></div>
              </div>
              {isLecturer && s.join_code && (
                <div className="flex items-center gap-1.5 bg-muted/40 rounded px-2.5 py-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <code className="font-mono font-semibold tracking-widest text-xs">{s.join_code}</code>
                  <button onClick={() => copy(s.join_code!)} className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                  {canWrite && <button onClick={() => regen(s)} className="text-xs text-primary hover:underline ml-1">{t("sessions.regen")}</button>}
                </div>
              )}
              {isLecturer ? (
                <>
                  {canWrite && s.status !== "live" && <button onClick={() => start(s.id)} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 flex items-center gap-1"><Play className="w-3 h-3" />{t("sessions.start")}</button>}
                  <Link to="/sessions/$id" params={{ id: s.id }} className="text-xs border border-border rounded px-3 py-1.5 hover:bg-accent">{t("sessions.open")}</Link>
                </>
              ) : (
                <Link to="/sessions/$id" params={{ id: s.id }} className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5">{t("sessions.view")}</Link>
              )}
            </div>
          );
        })}
        {sessions.length === 0 && <div className="text-sm text-muted-foreground text-center py-12">{t("sessions.empty")}</div>}
      </div>
    </div>
  );
}

export default SessionsPage;
