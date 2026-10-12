import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/GuideArticle";
import { guideHead } from "@/lib/guides-content";

export const Route = createFileRoute("/guides/email-templates")({
  head: () => guideHead("email-templates"),
  component: () => <GuideArticle slug="email-templates" />,
});
