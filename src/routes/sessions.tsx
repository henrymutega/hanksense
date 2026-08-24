import { createFileRoute } from "@tanstack/react-router";
import Sessions from "@/pages/Sessions";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions \u2014 HireSense AI" },
      { name: "description", content: "Run class sessions with codes, live jobs and classroom hiring exercises." },
      { property: "og:title", content: "Sessions \u2014 HireSense AI" },
      { property: "og:description", content: "Run class sessions with codes, live jobs and classroom hiring exercises." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sessions,
});
