import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password \u2014 Hanksense AI" },
      { name: "description", content: "Request a password reset link for your Hanksense AI account." },
      { property: "og:title", content: "Reset Password \u2014 Hanksense AI" },
      { property: "og:description", content: "Request a password reset link for your Hanksense AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});
