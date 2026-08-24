import { createFileRoute } from "@tanstack/react-router";
import Ethics from "@/pages/Ethics";

export const Route = createFileRoute("/ethics")({
  head: () => ({
    meta: [
      { title: "AI Ethics & Bias Controls \u2014 HireSense AI" },
      { name: "description", content: "Teach responsible AI hiring with bias guards, transparency and fairness controls." },
      { property: "og:title", content: "AI Ethics & Bias Controls \u2014 HireSense AI" },
      { property: "og:description", content: "Teach responsible AI hiring with bias guards, transparency and fairness controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ethics,
});
