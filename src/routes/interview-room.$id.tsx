import { createFileRoute } from "@tanstack/react-router";
import InterviewRoomDetail from "@/pages/InterviewRoomDetail";

export const Route = createFileRoute("/interview-room/$id")({
  head: () => ({
    meta: [
      { title: "Interview Room \u2014 HireSense AI" },
      { name: "description", content: "Live video interview room with audio, screen sharing and structured scorecards." },
      { property: "og:title", content: "Interview Room \u2014 HireSense AI" },
      { property: "og:description", content: "Live video interview room with audio, screen sharing and structured scorecards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterviewRoomDetail,
});
