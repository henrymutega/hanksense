import { useTranslation } from "react-i18next";
import { LANGS, setLang, type Lang } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.language?.split("-")[0] as Lang) || "en";
  return (
    <div className="px-3 pb-3">
      <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/50 mb-1.5">
        <Languages className="w-3 h-3" /> Language / 语言
      </label>
      <div className="grid grid-cols-2 gap-1">
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`text-xs py-1.5 rounded-md border transition-colors ${
              current === l.code
                ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                : "border-sidebar-border text-sidebar-foreground/80 hover:bg-sidebar-accent"
            }`}
          >
            <span className="mr-1">{l.flag}</span>{l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
