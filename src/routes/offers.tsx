import { createFileRoute } from "@tanstack/react-router";
import Offers from "@/pages/Offers";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers \u2014 HireSense AI" },
      { name: "description", content: "Draft, send and track job offers, and trigger the hiring cascade on acceptance." },
      { property: "og:title", content: "Offers \u2014 HireSense AI" },
      { property: "og:description", content: "Draft, send and track job offers, and trigger the hiring cascade on acceptance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Offers,
});
