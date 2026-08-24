import { createFileRoute } from "@tanstack/react-router";
import AiJobs from "@/pages/AiJobs";

export const Route = createFileRoute("/ai-jobs")({
  head: () => ({
    meta: [
      { title: "AI Job Copilot \u2014 HireSense AI" },
      { name: "description", content: "Generate complete, inclusive job postings with AI and publish them into a class session." },
      { property: "og:title", content: "AI Job Copilot \u2014 HireSense AI" },
      { property: "og:description", content: "Generate complete, inclusive job postings with AI and publish them into a class session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiJobs,
});
