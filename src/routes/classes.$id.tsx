import { createFileRoute } from "@tanstack/react-router";
import ClassesDetail from "@/pages/ClassesDetail";

export const Route = createFileRoute("/classes/$id")({
  head: () => ({
    meta: [
      { title: "Class Detail \u2014 HireSense AI" },
      { name: "description", content: "Sessions, enrolled students, quotas and job postings for a single class." },
      { property: "og:title", content: "Class Detail \u2014 HireSense AI" },
      { property: "og:description", content: "Sessions, enrolled students, quotas and job postings for a single class." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClassesDetail,
});
