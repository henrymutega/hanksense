import { createFileRoute } from "@tanstack/react-router";
import Pending from "@/pages/Pending";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [
      { title: "Account Pending Approval \u2014 HireSense AI" },
      { name: "description", content: "Your lecturer account is awaiting administrator approval." },
      { property: "og:title", content: "Account Pending Approval \u2014 HireSense AI" },
      { property: "og:description", content: "Your lecturer account is awaiting administrator approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pending,
});
