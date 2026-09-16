import { createFileRoute } from "@tanstack/react-router";
import AdminLecturer from "@/pages/AdminLecturer";

export const Route = createFileRoute("/admin_/lecturers/$id")({
  head: () => ({
    meta: [
      { title: "Lecturer Overview \u2014 Hanksense AI" },
      { name: "description", content: "Full admin view of one lecturer: classes, billing and every enrolled student with their activity." },
      { property: "og:title", content: "Lecturer Overview \u2014 Hanksense AI" },
      { property: "og:description", content: "Full admin view of one lecturer: classes, billing and every enrolled student with their activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLecturer,
});
