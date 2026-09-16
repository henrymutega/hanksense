import { createFileRoute } from "@tanstack/react-router";
import JobDetail from "@/pages/JobDetail";

export const Route = createFileRoute("/jobs_/$id")({
  head: () => ({
    meta: [
      { title: "Job Details \u2014 Hanksense AI" },
      { name: "description", content: "Full details of a posted role, including skills, compensation, interview process and the public application link." },
      { property: "og:title", content: "Job Details \u2014 Hanksense AI" },
      { property: "og:description", content: "Full details of a posted role, including skills, compensation, interview process and the public application link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobDetail,
});
