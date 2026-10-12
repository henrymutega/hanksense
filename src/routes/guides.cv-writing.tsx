import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/GuideArticle";
import { guideHead } from "@/lib/guides-content";

export const Route = createFileRoute("/guides/cv-writing")({
  head: () => guideHead("cv-writing"),
  component: () => <GuideArticle slug="cv-writing" />,
});
