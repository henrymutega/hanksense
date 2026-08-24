import { createFileRoute } from "@tanstack/react-router";
import JoinSession from "@/pages/JoinSession";

export const Route = createFileRoute("/join-session")({
  head: () => ({
    meta: [
      { title: "Join a Class \u2014 HireSense AI" },
      { name: "description", content: "Enter your lecturer's class code to join a session and start working." },
      { property: "og:title", content: "Join a Class \u2014 HireSense AI" },
      { property: "og:description", content: "Enter your lecturer's class code to join a session and start working." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinSession,
});
