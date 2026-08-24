import { createFileRoute } from "@tanstack/react-router";
import Billing from "@/pages/Billing";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Semester Plan \u2014 HireSense AI" },
      { name: "description", content: "Manage your semester subscription and teaching seats for HireSense AI." },
      { property: "og:title", content: "Billing & Semester Plan \u2014 HireSense AI" },
      { property: "og:description", content: "Manage your semester subscription and teaching seats for HireSense AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Billing,
});
