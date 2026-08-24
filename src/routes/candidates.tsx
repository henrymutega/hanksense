import { createFileRoute } from "@tanstack/react-router";
import Candidates from "@/pages/Candidates";

export const Route = createFileRoute("/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates \u2014 HireSense AI" },
      { name: "description", content: "Browse applicants, match scores and hiring stages across your class job postings." },
      { property: "og:title", content: "Candidates \u2014 HireSense AI" },
      { property: "og:description", content: "Browse applicants, match scores and hiring stages across your class job postings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Candidates,
});
