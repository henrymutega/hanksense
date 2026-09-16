import { PageHeader } from "@/components/PageHeader";
import { StudentsDirectory } from "@/components/StudentsDirectory";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

function StudentsPage() {
  const { t } = useTranslation();
  const { role } = useAuth();

  if (role !== "lecturer" && role !== "admin") {
    return (
      <div>
        <PageHeader title={t("students.title")} />
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          {t("students.lecturerOnly")}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("students.title")} subtitle={t("students.subtitle")} />
      <StudentsDirectory />
    </div>
  );
}

export default StudentsPage;
