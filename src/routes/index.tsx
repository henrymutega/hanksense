import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hanksense AI \u2014 Decode Any Job Ad, Score Your CV & Land More Interviews" },
      { name: "description", content: "AI job matching for job seekers: instant job requirement analysis, ATS CV match scoring and 1-click CV tailoring \u2014 plus end-to-end recruitment simulations for universities and students." },
      { property: "og:title", content: "Hanksense AI \u2014 Decode Any Job Ad, Score Your CV & Land More Interviews" },
      { property: "og:description", content: "AI job matching for job seekers: instant job requirement analysis, ATS CV match scoring and 1-click CV tailoring \u2014 plus end-to-end recruitment simulations for universities and students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
