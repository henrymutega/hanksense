import { createFileRoute } from "@tanstack/react-router";
import TalentPool from "@/pages/TalentPool";

export const Route = createFileRoute("/talent-pool")({
  head: () => ({
    meta: [
      { title: "Talent Pool \u2014 HireSense AI" },
      { name: "description", content: "Keep non-hired candidates with their strengths and applied roles for future openings." },
      { property: "og:title", content: "Talent Pool \u2014 HireSense AI" },
      { property: "og:description", content: "Keep non-hired candidates with their strengths and applied roles for future openings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TalentPool,
});
