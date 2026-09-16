import { accessEnd } from "@/lib/billing";
import { useEffect, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { StudentsDirectory } from "@/components/StudentsDirectory";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, School } from "lucide-react";

type Lecturer = {
  id: string;
  full_name: string | null;
  email: string | null;
  institution: string | null;
  department: string | null;
  phone: string | null;
  account_status: string;
};

function AdminLecturerPage() {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const { id } = useParams({ from: "/admin_/lecturers/$id" });
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);
  const [billing, setBilling] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "admin") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: b }, { data: cls }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, institution, department, phone, account_status").eq("id", id).maybeSingle(),
        supabase.from("lecturer_billing").select("*").eq("lecturer_id", id).maybeSingle(),
        supabase.from("classes").select("id, name, course_code, semester, academic_year, created_at").eq("lecturer_id", id).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setLecturer((p as any) ?? null);
      setBilling(b ?? null);
      setClasses((cls as any[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, role]);

  if (role !== "admin") {
    return (
      <div>
        <PageHeader title={t("adminLecturer.title")} />
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">{t("adminLecturer.adminOnly")}</div>
      </div>
    );
  }

  // Access window measured from the activation date (7d trial / 90d active).
  const accessEndDate: Date | null = accessEnd(billing as any);



  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-3.5 h-3.5" /> {t("adminLecturer.back")}
      </Link>

      <PageHeader
        title={lecturer?.full_name || t("adminLecturer.title")}
        subtitle={lecturer?.email || undefined}
      />

      <div className="bg-card border border-border rounded-xl p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.institution")}</div>
          <div className="mt-1">{[lecturer?.institution, lecturer?.department].filter(Boolean).join(" · ") || "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.account")}</div>
          <div className="mt-1">{lecturer ? t(`admin.filters.${lecturer.account_status}` as any) : "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.billingCol")}</div>
          <div className="mt-1 uppercase">{accessEndDate && accessEndDate.getTime() > Date.now() && (billing?.status === "active" || billing?.status === "trial") ? billing?.status : "expired"}</div>
          {billing?.activated_at && <div className="text-[11px] text-muted-foreground">Activated {new Date(billing.activated_at).toLocaleDateString(i18n.language)}</div>}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.ends")}</div>
          <div className="mt-1">{accessEndDate ? accessEndDate.toLocaleDateString(i18n.language) : "—"}</div>
          {accessEndDate && <div className="text-[11px] text-muted-foreground">{Math.max(0, Math.ceil((accessEndDate.getTime() - Date.now()) / 86400000))} days left</div>}
        </div>

      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("admin.classes")}</div>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("adminLecturer.noClasses")}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map(c => (
              <li key={c.id}>
                <Link to="/classes/$id" params={{ id: c.id }} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary hover:bg-accent transition-colors">
                  <School className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{c.course_code ? `${c.course_code} · ` : ""}{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="font-semibold mb-3">{t("adminLecturer.studentsHeading")}</h2>
      <StudentsDirectory lecturerId={id} />
    </div>
  );
}

export default AdminLecturerPage;
