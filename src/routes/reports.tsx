import { createFileRoute } from "@tanstack/react-router";
import Reports from "@/pages/Reports";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics \u2014 HireSense AI" },
      { name: "description", content: "Recruitment funnel analytics, time-to-hire and class performance reporting." },
      { property: "og:title", content: "Reports & Analytics \u2014 HireSense AI" },
      { property: "og:description", content: "Recruitment funnel analytics, time-to-hire and class performance reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});
