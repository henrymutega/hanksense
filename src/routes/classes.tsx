import { createFileRoute } from "@tanstack/react-router";
import Classes from "@/pages/Classes";

export const Route = createFileRoute("/classes")({
  head: () => ({
    meta: [
      { title: "Classes \u2014 HireSense AI" },
      { name: "description", content: "Create classes, share join codes and follow every student's recruitment work." },
      { property: "og:title", content: "Classes \u2014 HireSense AI" },
      { property: "og:description", content: "Create classes, share join codes and follow every student's recruitment work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Classes,
});
