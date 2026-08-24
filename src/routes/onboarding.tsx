import { createFileRoute } from "@tanstack/react-router";
import Onboarding from "@/pages/Onboarding";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding \u2014 HireSense AI" },
      { name: "description", content: "Guide new hires through post-offer onboarding steps in the simulation." },
      { property: "og:title", content: "Onboarding \u2014 HireSense AI" },
      { property: "og:description", content: "Guide new hires through post-offer onboarding steps in the simulation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});
