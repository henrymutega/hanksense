import { createFileRoute } from "@tanstack/react-router";
import Pipeline from "@/pages/Pipeline";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Hiring Pipeline \u2014 HireSense AI" },
      { name: "description", content: "Drag candidates through a seven-stage recruitment pipeline from applied to hired." },
      { property: "og:title", content: "Hiring Pipeline \u2014 HireSense AI" },
      { property: "og:description", content: "Drag candidates through a seven-stage recruitment pipeline from applied to hired." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ job: (s.job as string) || "" }),
  component: Pipeline,
});
