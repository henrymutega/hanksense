import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Briefcase, Users, GitBranch, CalendarDays,
  BarChart3, Sparkles, ShieldAlert, GraduationCap, FileText, UserCheck, Brain, Wand2, UploadCloud,
  School, CreditCard, ShieldCheck, Menu, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/lib/auth";

export function AppSidebar() {
  const path = useRouterState({ select: s => s.location.pathname });
  const { t } = useTranslation();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);

  const isLecturer = role === "lecturer" || role === "admin";
  const isStudent = role === "student";
  const isAdmin = role === "admin";

  const NAV: { group: string; items: { to: string; label: string; icon: any }[] }[] = [];

  NAV.push({ group: t("nav.overview"), items: [{ to: "/", label: t("nav.dashboard"), icon: LayoutDashboard }] });

  if (isLecturer) {
    NAV.push({ group: t("nav.teaching"), items: [
      { to: "/classes", label: t("nav.classes"), icon: School },
      { to: "/sessions", label: t("nav.sessions"), icon: CalendarDays },
    ]});
    NAV.push({ group: t("nav.aiCopilot"), items: [
      { to: "/ai-jobs", label: t("nav.aiJobs"), icon: Wand2 },
      { to: "/screening", label: t("nav.screening"), icon: UploadCloud },
    ]});
    NAV.push({ group: t("nav.hiring"), items: [
      { to: "/jobs", label: t("nav.jobs"), icon: Briefcase },
      { to: "/candidates", label: t("nav.candidates"), icon: Users },
      { to: "/pipeline", label: t("nav.pipeline"), icon: GitBranch },
      { to: "/interviews", label: t("nav.interviews"), icon: CalendarDays },
      { to: "/offers", label: t("nav.offers"), icon: FileText },
    ]});
    NAV.push({ group: t("nav.postHire"), items: [
      { to: "/onboarding", label: t("nav.onboarding"), icon: UserCheck },
      { to: "/talent-pool", label: t("nav.talentPool"), icon: Brain },
      { to: "/reports", label: t("nav.reports"), icon: BarChart3 },
    ]});
    NAV.push({ group: t("nav.aiEthics"), items: [
      { to: "/simulation", label: t("nav.lectureMode"), icon: GraduationCap },
      { to: "/ethics", label: t("nav.ethics"), icon: ShieldAlert },
    ]});
    NAV.push({ group: t("nav.account"), items: [{ to: "/billing", label: t("nav.billing"), icon: CreditCard }] });
  }

  if (isStudent) {
    NAV.push({ group: t("nav.class"), items: [
      { to: "/sessions", label: t("nav.mySessions"), icon: CalendarDays },
      { to: "/simulation", label: t("nav.lectureMode"), icon: GraduationCap },
    ]});
    NAV.push({ group: t("nav.aiCopilot"), items: [
      { to: "/ai-jobs", label: t("nav.aiJobs"), icon: Wand2 },
      { to: "/screening", label: t("nav.screening"), icon: UploadCloud },
    ]});
    NAV.push({ group: t("nav.hiring"), items: [
      { to: "/jobs", label: t("nav.jobs"), icon: Briefcase },
      { to: "/candidates", label: t("nav.candidates"), icon: Users },
      { to: "/pipeline", label: t("nav.pipeline"), icon: GitBranch },
      { to: "/interviews", label: t("nav.interviews"), icon: CalendarDays },
      { to: "/offers", label: t("nav.offers"), icon: FileText },
    ]});
    NAV.push({ group: t("nav.aiEthics"), items: [
      { to: "/ethics", label: t("nav.ethics"), icon: ShieldAlert },
    ]});
  }

  if (isAdmin) {
    NAV.push({ group: t("nav.adminGroup"), items: [{ to: "/admin", label: t("nav.allLecturers"), icon: ShieldCheck }] });
  }

  if (!role) {
    NAV.push({ group: t("nav.account"), items: [{ to: "/billing", label: t("nav.setup"), icon: CreditCard }] });
  }

  const sidebarInner = (
    <>
      <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary grid place-items-center">
          <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm leading-tight truncate">{t("nav.brand")}</div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 truncate">{t("nav.brandSub")}</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/80"
          aria-label={t("nav.closeMenu")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map(g => (
          <div key={g.group}>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 px-3 mb-2">{g.group}</div>
            <ul className="space-y-0.5">
              {g.items.map(it => {
                const active = path === it.to;
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link to={it.to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                      <Icon className="w-4 h-4" />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <LanguageSwitcher />
      <UserMenu />
    </>
  );

  return (
    <>
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center gap-3 px-4">
        <button onClick={() => setOpen(true)} aria-label={t("nav.openMenu")} className="p-1.5 rounded hover:bg-sidebar-accent">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-7 h-7 rounded-md bg-sidebar-primary grid place-items-center">
          <Sparkles className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <div className="font-semibold text-sm truncate">{t("nav.brand")}</div>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col
          fixed md:sticky top-0 h-screen z-50 transition-transform
          w-72 md:w-64 md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {sidebarInner}
      </aside>
    </>
  );
}
