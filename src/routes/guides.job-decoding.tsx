import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle } from "@/components/GuideArticle";
import { guideHead } from "@/lib/guides-content";

export const Route = createFileRoute("/guides/job-decoding")({
  head: () => guideHead("job-decoding"),
  component: () => <GuideArticle slug="job-decoding" />,
});
