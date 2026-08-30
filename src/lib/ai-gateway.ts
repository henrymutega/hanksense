import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export const createLovableAiGatewayProvider = (lovableApiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

const createOpenAiFallbackProvider = (openAiApiKey: string) =>
  createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

export type ResolvedModel = {
  model: LanguageModel;
  provider: "lovable" | "openai";
  modelId: string;
  /** Provider-options key (must equal the provider `name`). */
  providerKey: "lovable" | "openai";
  /** True when the provider accepts an OpenAI-style JSON response format. */
  supportsJsonMode: boolean;
};

export const AI_MISSING_KEY_CODE = "AI_NOT_CONFIGURED";

/**
 * Lovable-hosted AI generation proxy (src/routes/api/public/ai-generate.ts).
 * Local `bun run dev` has no LOVABLE_API_KEY, so it forwards generation
 * requests here with the caller's Supabase session token.
 *
 * IMPORTANT: the proxy must point at the PUBLISHED site — the preview URL
 * sits behind Lovable's auth bridge and redirects server-to-server calls.
 * After publishing, set AI_PROXY_URL in .env.local:
 *   AI_PROXY_URL=https://<your-published-domain>/api/public/ai-generate
 */
export const DEFAULT_AI_PROXY_URL =
  "https://id-preview--dfc88797-2921-4da8-b513-2940dbd3352e.lovable.app/api/public/ai-generate";

/** Thrown when no AI provider key is present in this environment. */
export class AiConfigurationError extends Error {
  readonly code = AI_MISSING_KEY_CODE;
  constructor(message: string) {
    super(message);
    this.name = "AiConfigurationError";
  }
}

export function isAiConfigurationError(error: unknown): boolean {
  if (error instanceof AiConfigurationError) return true;
  const message = (error as { message?: string } | null)?.message;
  return typeof message === "string" && message.includes(AI_MISSING_KEY_CODE);
}

const JSON_GUARD =
  "\n\nReturn ONLY valid JSON. No markdown fences. No prose. No explanation. Start your response with { and end with }.";

/**
 * Generates raw AI text for the current environment:
 * - Lovable hosting / anywhere with a key: calls the provider directly.
 * - Local dev without keys: forwards the prompt to the Lovable-hosted
 *   /api/public/ai-generate proxy using the caller's Supabase session token,
 *   so Lovable's managed credentials are used — no OPENAI_API_KEY needed.
 */
export async function generateAiText(
  prompt: string,
  lovableKey?: string,
  openAiKey?: string,
): Promise<string> {
  if (lovableKey || openAiKey) {
    const { model, providerKey, supportsJsonMode } = resolveAiProvider(lovableKey, openAiKey);
    const { generateText } = await import("ai");
    const { text } = await generateText({
      model,
      prompt: prompt + JSON_GUARD,
      ...(supportsJsonMode
        ? { providerOptions: { [providerKey]: { response_format: { type: "json_object" } } } }
        : {}),
    });
    return text;
  }

  // Local dev fallback: proxy through the Lovable-hosted deployment.
  const { getRequestHeaders } = await import("@tanstack/react-start/server");
  const auth = getRequestHeaders().get("authorization");
  if (!auth) {
    throw new AiConfigurationError(
      `${AI_MISSING_KEY_CODE}: AI runs through your Lovable account — sign in to the app first, then try again.`,
    );
  }
  const proxyUrl = process.env.AI_PROXY_URL ?? DEFAULT_AI_PROXY_URL;
  const res = await fetch(proxyUrl, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify({ prompt: prompt + JSON_GUARD }),
  });
  if (res.status >= 300 && res.status < 400) {
    throw new AiConfigurationError(
      `${AI_MISSING_KEY_CODE}: The AI proxy URL redirected to a login page. Publish the app in Lovable, then set AI_PROXY_URL in .env.local to "<your-published-url>/api/public/ai-generate".`,
    );
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new AiConfigurationError(
        `${AI_MISSING_KEY_CODE}: Your session was not accepted by the AI proxy — sign in again and retry.`,
      );
    }
    throw new Error(`AI proxy request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { text?: string };
  if (typeof json.text !== "string") {
    throw new Error("AI proxy returned an unexpected response.");
  }
  return json.text;
}

/**
 * Resolves the best available AI provider for the current environment.
 * - Lovable hosting supplies LOVABLE_API_KEY.
 * - Local dev / Vercel / external hosting can set OPENAI_API_KEY instead.
 */
export function resolveAiProvider(
  lovableApiKey?: string,
  openAiApiKey?: string,
): ResolvedModel {
  if (lovableApiKey) {
    const gateway = createLovableAiGatewayProvider(lovableApiKey);
    return {
      model: gateway("google/gemini-3-flash-preview") as LanguageModel,
      provider: "lovable",
      modelId: "google/gemini-3-flash-preview",
      providerKey: "lovable",
      supportsJsonMode: false,
    };
  }

  if (openAiApiKey) {
    const openai = createOpenAiFallbackProvider(openAiApiKey);
    return {
      model: openai("gpt-4.1-mini") as LanguageModel,
      provider: "openai",
      modelId: "gpt-4.1-mini",
      providerKey: "openai",
      supportsJsonMode: true,
    };
  }

  throw new AiConfigurationError(
    `${AI_MISSING_KEY_CODE}: No AI provider key configured. On Lovable hosting LOVABLE_API_KEY is supplied automatically; for local development or external hosting add OPENAI_API_KEY to your environment (.env.local locally, project settings on Vercel).`,
  );
}


