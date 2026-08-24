import { createFileRoute } from "@tanstack/react-router";
import CandidatesDetail from "@/pages/CandidatesDetail";

export const Route = createFileRoute("/candidates/$id")({
  head: () => ({
    meta: [
      { title: "Candidate Profile \u2014 HireSense AI" },
      { name: "description", content: "Review a candidate's CV insights, strengths, match score and pipeline history." },
      { property: "og:title", content: "Candidate Profile \u2014 HireSense AI" },
      { property: "og:description", content: "Review a candidate's CV insights, strengths, match score and pipeline history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CandidatesDetail,
});
