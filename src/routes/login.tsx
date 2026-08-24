import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In \u2014 HireSense AI" },
      { name: "description", content: "Sign in to your HireSense AI lecturer, student or admin account." },
      { property: "og:title", content: "Sign In \u2014 HireSense AI" },
      { property: "og:description", content: "Sign in to your HireSense AI lecturer, student or admin account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});
