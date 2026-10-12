import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  dataUrl: z.string().min(30).max(9_000_000),
  mime: z.string().max(100),
  filename: z.string().max(200).default("file"),
});

/** Reads a photo/screenshot or scanned PDF of a job ad and returns its text. */
export const extractJobFromFile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "Reading photos is only available on the live site. Please paste the text instead." };
    const isPdf = data.mime === "application/pdf";
    if (!isPdf && !data.mime.startsWith("image/")) return { error: "Unsupported file type." };
    try {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const { streamText } = await import("ai");
      const openai = createOpenAI({
        apiKey: key,
        baseURL: "https://ai.gateway.lovable.dev/v1",
        headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      });
      const media = isPdf
        ? { type: "file" as const, filename: data.filename, data: data.dataUrl.split(",")[1] ?? "", mediaType: "application/pdf" }
        : { type: "image" as const, image: new URL(data.dataUrl) };
      const result = streamText({
        model: openai.responses("openai/gpt-6-astra"),
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Transcribe the full job advertisement in this file as plain text, keeping its original language and structure (title, company, responsibilities, requirements, etc.). Output only the job text. If there is no job description, output NONE." },
            media,
          ],
        }],
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false } },
      });
      const text = (await result.text).trim();
      if (!text || text === "NONE") return { error: "No job description found in this file." };
      return { text: text.slice(0, 20000) };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("jd extract error", e);
      if (status === 429) return { error: "Too many requests — please wait a moment and try again." };
      if (status === 402) return { error: "AI is temporarily unavailable." };
      return { error: "Couldn't read this file. Please paste the text instead." };
    }
  });
