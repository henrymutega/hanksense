import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LANGS, setLang, type Lang } from "@/lib/i18n";
import { useScrollY, useScrollProgress } from "@/hooks/use-reveal";
import { Brain, Languages } from "lucide-react";

/**
 * Shared public (logged-out) top navigation used by the landing page and the
 * auth pages. Fully responsive and language-aware.
 */
export function PublicNav({ showProgress = false }: { showProgress?: boolean }) {
  const { t, i18n } = useTranslation();
  const current = (i18n.language?.split("-")[0] as Lang) || "en";
  const scrollY = useScrollY();
  const progress = useScrollProgress();
  const scrolled = scrollY > 12;

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-border bg-background/80 backdrop-blur-xl shadow-[0_8px_30px_-24px_rgba(0,0,0,0.6)]"
          : "border-transparent bg-background/50 backdrop-blur"
      }`}
    >
      {showProgress && (
        <div
          className="absolute left-0 bottom-0 h-0.5 bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      )}
      <div
        className={`max-w-6xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-6 transition-all duration-300 ${
          scrolled ? "h-14 sm:h-12" : "h-16"
        }`}
      >
        <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <Brain className={`shrink-0 text-primary transition-all duration-300 ${scrolled ? "w-4 h-4" : "w-5 h-5"}`} />
          <span className="truncate">Hanksense AI</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <Languages className="hidden sm:block w-4 h-4 text-muted-foreground mr-1" />
          <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-pressed={current === l.code}
                className={`text-[11px] sm:text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                  current === l.code ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
                }`}
              >
                <span className="mr-1">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
          <Link
            to="/login"
            className="ml-1 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            {t("landing.signIn")}
          </Link>
          <Link
            to="/signup"
            search={{ code: "", role: "" as const }}
            className="hidden sm:inline-flex text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("landing.getStarted")}
          </Link>
        </div>
      </div>
    </header>
  );
}
