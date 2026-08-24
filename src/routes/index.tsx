import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireSense AI \u2014 Teach Modern Hiring with an AI-Powered ATS" },
      { name: "description", content: "Classroom-ready AI recruitment platform: lecturers run classes and sessions, students post jobs, screen CVs, interview and hire \u2014 end to end." },
      { property: "og:title", content: "HireSense AI \u2014 Teach Modern Hiring with an AI-Powered ATS" },
      { property: "og:description", content: "Classroom-ready AI recruitment platform: lecturers run classes and sessions, students post jobs, screen CVs, interview and hire \u2014 end to end." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
