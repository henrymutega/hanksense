import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/GuideArticle";
import { guideHead } from "@/lib/guides-content";

export const Route = createFileRoute("/guides/cover-letters")({
  head: () => guideHead("cover-letters"),
  component: () => <GuideArticle slug="cover-letters" />,
});
