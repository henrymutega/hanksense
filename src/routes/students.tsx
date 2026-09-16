import { createFileRoute } from "@tanstack/react-router";
import Students from "@/pages/Students";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "My Students \u2014 Hanksense AI" },
      { name: "description", content: "Every student enrolled in your classes with their sessions, job postings and candidate activity." },
      { property: "og:title", content: "My Students \u2014 Hanksense AI" },
      { property: "og:description", content: "Every student enrolled in your classes with their sessions, job postings and candidate activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Students,
});
