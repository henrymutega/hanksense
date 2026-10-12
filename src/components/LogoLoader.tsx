import { Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import React from "react";

/**
 * Branded full-screen loading state used while the app boots, auth resolves,
 * or a page chunk loads. Pure CSS animation — no added loading time.
 */
export function LogoLoader({
  label,
  className,
  exiting = false,
}: {
  label?: string;
  className?: string;
  exiting?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={[
        "min-h-screen grid place-items-center bg-background transition-opacity duration-500 ease-out",
        exiting ? "opacity-0 pointer-events-none" : "opacity-100",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div className="relative">
          <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping [animation-duration:1.6s]" />
          <span className="absolute -inset-3 rounded-full border-2 border-transparent border-t-primary animate-spin [animation-duration:0.9s]" />
          <div className="relative w-12 h-12 rounded-2xl bg-primary grid place-items-center shadow-lg">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <div className="text-sm font-semibold tracking-tight">Hanksense AI</div>
        <div className="text-xs text-muted-foreground">{label ?? t("common.loading")}</div>
      </div>
    </div>
  );
}

/**
 * Smoothly cross-fades between the branded loader and the loaded page.
 * The loader overlays the children while loading, then fades out to reveal
 * children that fade in underneath. Prevents the harsh flash when auth or
 * data finishes resolving.
 */
export function FadeTransition({
  loading,
  children,
  minDisplayMs = 400,
  loaderLabel,
}: {
  loading: boolean;
  children: React.ReactNode;
  minDisplayMs?: number;
  loaderLabel?: string;
}) {
  const [showOverlay, setShowOverlay] = React.useState(true);
  const [exiting, setExiting] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    if (loading) {
      setShowOverlay(true);
      setExiting(false);
      return;
    }
    // Content is ready; begin fade-out after a short minimum display so the
    // loader doesn't flash on ultra-fast resolves.
    const start = setTimeout(() => setExiting(true), Math.max(0, minDisplayMs - 200));
    const finish = setTimeout(() => {
      setShowOverlay(false);
      setHasMounted(true);
    }, minDisplayMs);
    return () => {
      clearTimeout(start);
      clearTimeout(finish);
    };
  }, [loading, minDisplayMs]);

  return (
    <div className="relative min-h-screen">
      <div
        className={[
          "transition-opacity duration-500 ease-out",
          !showOverlay || hasMounted ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {children}
      </div>
      {showOverlay && (
        <div className="absolute inset-0 z-50 transition-opacity duration-500 ease-out">
          <LogoLoader label={loaderLabel} exiting={exiting} />
        </div>
      )}
    </div>
  );
}
