import { createFileRoute } from "@tanstack/react-router";
import Interviews from "@/pages/Interviews";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interview Scheduling \u2014 HireSense AI" },
      { name: "description", content: "Schedule interviews on a real calendar with Google Calendar and .ics sync." },
      { property: "og:title", content: "Interview Scheduling \u2014 HireSense AI" },
      { property: "og:description", content: "Schedule interviews on a real calendar with Google Calendar and .ics sync." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Interviews,
});
