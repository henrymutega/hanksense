import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password \u2014 Hanksense AI" },
      { name: "description", content: "Reset your Hanksense AI password with a 6-digit email code." },
      { property: "og:title", content: "Reset Password \u2014 Hanksense AI" },
      { property: "og:description", content: "Reset your Hanksense AI password with a 6-digit email code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});
