const PUBLIC_PREVIEW_ORIGIN =
  "https://project--dfc88797-2921-4da8-b513-2940dbd3352e-dev.lovable.app";

export function getPublicApplyUrl(jobId: string) {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname;
  const isProtectedPreview =
    host.includes("id-preview") ||
    host.endsWith("lovableproject.com") ||
    host.endsWith("lovableproject-dev.com");
  const origin = isProtectedPreview ? PUBLIC_PREVIEW_ORIGIN : window.location.origin;

  return `${origin}/api/public/apply-page/${encodeURIComponent(jobId)}`;
}