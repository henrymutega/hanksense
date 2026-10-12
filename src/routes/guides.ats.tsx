import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/GuideArticle";
import { guideHead } from "@/lib/guides-content";

export const Route = createFileRoute("/guides/ats")({
  head: () => guideHead("ats"),
  component: () => <GuideArticle slug="ats" />,
});
