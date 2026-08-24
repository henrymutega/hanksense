import { createFileRoute } from "@tanstack/react-router";
import JoinDetail from "@/pages/JoinDetail";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "Join by Invite Code \u2014 HireSense AI" },
      { name: "description", content: "Redeem a class or session invite code for HireSense AI." },
      { property: "og:title", content: "Join by Invite Code \u2014 HireSense AI" },
      { property: "og:description", content: "Redeem a class or session invite code for HireSense AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinDetail,
});
