import { createFileRoute } from "@tanstack/react-router";
import Guides from "@/pages/Guides";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Career & Hiring Academy — Hanksense AI" },
      { name: "description", content: "Free guides on beating ATS filters, writing high-impact CVs, decoding job ads, the recruiter's 6-second scan and video interview mastery." },
      { property: "og:title", content: "Career & Hiring Academy — Hanksense AI" },
      { property: "og:description", content: "Learn how ATS systems work, write achievement-based CVs and ace interviews — in English and Chinese." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://hanksence.app/guides" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://hanksence.app/guides" }],
  }),
  component: Guides,
});
