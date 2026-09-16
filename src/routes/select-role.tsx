import { createFileRoute } from "@tanstack/react-router";
import SelectRole from "@/pages/SelectRole";

export const Route = createFileRoute("/select-role")({
  head: () => ({
    meta: [
      { title: "Choose Your Role \u2014 Hanksense AI" },
      { name: "description", content: "Continue as a lecturer or student to set up your Hanksense AI workspace." },
      { property: "og:title", content: "Choose Your Role \u2014 Hanksense AI" },
      { property: "og:description", content: "Continue as a lecturer or student to set up your Hanksense AI workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SelectRole,
});
