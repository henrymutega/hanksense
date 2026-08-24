import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console \u2014 HireSense AI" },
      { name: "description", content: "Oversee lecturers, students, classes and platform activity across the HireSense AI teaching platform." },
      { property: "og:title", content: "Admin Console \u2014 HireSense AI" },
      { property: "og:description", content: "Oversee lecturers, students, classes and platform activity across the HireSense AI teaching platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});
