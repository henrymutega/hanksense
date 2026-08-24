import { createFileRoute } from "@tanstack/react-router";
import PresentDetail from "@/pages/PresentDetail";

export const Route = createFileRoute("/present/$sessionId")({
  head: () => ({
    meta: [
      { title: "Presentation Mode \u2014 HireSense AI" },
      { name: "description", content: "Full-screen classroom view of live session hiring metrics and candidate flow." },
      { property: "og:title", content: "Presentation Mode \u2014 HireSense AI" },
      { property: "og:description", content: "Full-screen classroom view of live session hiring metrics and candidate flow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PresentDetail,
});
