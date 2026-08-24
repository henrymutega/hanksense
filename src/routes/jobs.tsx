import { createFileRoute } from "@tanstack/react-router";
import Jobs from "@/pages/Jobs";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Job Postings \u2014 HireSense AI" },
      { name: "description", content: "Manage published class job postings and track applicants per role." },
      { property: "og:title", content: "Job Postings \u2014 HireSense AI" },
      { property: "og:description", content: "Manage published class job postings and track applicants per role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jobs,
});
