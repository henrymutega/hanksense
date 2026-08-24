import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/pages/Signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account \u2014 HireSense AI" },
      { name: "description", content: "Sign up as a lecturer or join your class with a student code." },
      { property: "og:title", content: "Create Account \u2014 HireSense AI" },
      { property: "og:description", content: "Sign up as a lecturer or join your class with a student code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === "string" ? s.code : "",
    role: (s.role === "lecturer" || s.role === "student" ? s.role : "") as "" | "lecturer" | "student",
  }),
  component: Signup,
});
