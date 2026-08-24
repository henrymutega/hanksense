import { createFileRoute } from "@tanstack/react-router";
import Simulation from "@/pages/Simulation";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Lecture Mode Simulation \u2014 HireSense AI" },
      { name: "description", content: "Run a guided, end-to-end hiring simulation live in the lecture hall." },
      { property: "og:title", content: "Lecture Mode Simulation \u2014 HireSense AI" },
      { property: "og:description", content: "Run a guided, end-to-end hiring simulation live in the lecture hall." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Simulation,
});
