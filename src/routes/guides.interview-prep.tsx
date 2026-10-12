import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/GuideArticle";
import { guideHead } from "@/lib/guides-content";

export const Route = createFileRoute("/guides/interview-prep")({
  head: () => guideHead("interview-prep"),
  component: () => <GuideArticle slug="interview-prep" />,
});
