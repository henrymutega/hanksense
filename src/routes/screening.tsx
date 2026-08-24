import { createFileRoute } from "@tanstack/react-router";
import Screening from "@/pages/Screening";

export const Route = createFileRoute("/screening")({
  head: () => ({
    meta: [
      { title: "CV Screening \u2014 HireSense AI" },
      { name: "description", content: "Upload CVs and let AI parse, score and match applicants to your job posting." },
      { property: "og:title", content: "CV Screening \u2014 HireSense AI" },
      { property: "og:description", content: "Upload CVs and let AI parse, score and match applicants to your job posting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ job: (s.job as string) || "" }),
  component: Screening,
});
