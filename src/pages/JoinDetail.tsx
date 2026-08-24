import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";



function JoinRedirect() {
  const { t } = useTranslation();
  const { code } = useParams({ from: "/join/$code" });
  const nav = useNavigate();
  useEffect(() => { nav({ to: "/signup", search: { code, role: "student" } as any }); }, [code, nav]);
  return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">{t("auth.joinRedirect")}</div>;
}

export default JoinRedirect;
