import { createFileRoute } from "@tanstack/react-router";
import SessionsDetail from "@/pages/SessionsDetail";

export const Route = createFileRoute("/sessions_/$id")({
  head: () => ({
    meta: [
      { title: "Session Detail \u2014 Hanksense AI" },
      { name: "description", content: "Session analytics, student activity and job postings for one class session." },
      { property: "og:title", content: "Session Detail \u2014 Hanksense AI" },
      { property: "og:description", content: "Session analytics, student activity and job postings for one class session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SessionsDetail,
});
