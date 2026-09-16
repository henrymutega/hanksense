import { createFileRoute } from "@tanstack/react-router";
import Apply from "@/pages/Apply";

export const Route = createFileRoute("/apply/$jobId")({
  head: () => ({
    meta: [
      { title: "Apply for this role \u2014 Hanksense AI" },
      { name: "description", content: "Submit your CV for this open role. Applications are screened with AI and reviewed by the hiring team." },
      { property: "og:title", content: "Apply for this role \u2014 Hanksense AI" },
      { property: "og:description", content: "Submit your CV for this open role. Applications are screened with AI and reviewed by the hiring team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Apply,
});
