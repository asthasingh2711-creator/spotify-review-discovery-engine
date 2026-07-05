import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { getGeminiClient, getGeminiModel } from "@/services/gemini/client";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: boolean;
        schema: Record<string, unknown>;
      };
    };

export type LlmCallOptions = {
  maxCompletionTokens?: number;
  temperature?: number;
  reasoningEffort?: "low" | "medium" | "high";
  responseFormat?: LlmResponseFormat;
};

export class LlmQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmQuotaError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function interRequestDelayMs() {
  return 300 + Math.floor(Math.random() * 400);
}

function isDailyQuotaError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? "").toLowerCase();
  return (
    msg.includes("tokens per day") ||
    msg.includes("daily") && msg.includes("limit") ||
    msg.includes("quota exceeded")
  );
}

function isTransientRateLimit(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; message?: string };
  if (e.status === 429 && !isDailyQuotaError(err)) return true;
  const msg = String(e.message ?? "").toLowerCase();
  return msg.includes("429") || msg.includes("tokens per minute") || msg.includes("rate limit");
}

export function formatLlmError(err: unknown): string {
  if (err instanceof LlmQuotaError) return err.message;
  if (isDailyQuotaError(err)) {
    return "Daily LLM token limit reached. Analysis uses only 2 API calls — try again tomorrow, or load a previously saved report from the Dashboard.";
  }
  if (err instanceof Error) return err.message;
  return "Unknown AI error";
}

export async function callChatWithRetry(
  client: Cerebras,
  model: string,
  messages: ChatMessage[],
  opts: LlmCallOptions = {},
): Promise<string> {
  const maxAttempts = 4;
  let attempt = 0;

  while (true) {
    try {
      const resp = (await client.chat.completions.create({
        model,
        messages,
        max_completion_tokens: opts.maxCompletionTokens ?? 4096,
        temperature: opts.temperature ?? 0.2,
        top_p: 1,
        stream: false,
        reasoning_effort: opts.reasoningEffort ?? "low",
        ...(opts.responseFormat ? { response_format: opts.responseFormat as never } : {}),
      })) as { choices?: { message?: { content?: string } }[] };
      return resp.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (isDailyQuotaError(err)) {
        throw new LlmQuotaError(formatLlmError(err));
      }
      attempt++;
      if (!isTransientRateLimit(err) || attempt >= maxAttempts) throw err;
      const backoff = Math.min(30_000, interRequestDelayMs() * 2 ** attempt);
      await sleep(backoff);
    }
  }
}

function schemaHint(opts: LlmCallOptions): string {
  if (opts.responseFormat?.type !== "json_schema") return "";
  const schema = opts.responseFormat.json_schema.schema;
  return `\n\nReturn JSON only (no markdown), matching this schema:\n${JSON.stringify(schema)}`;
}

export async function callGeminiWithRetry(messages: ChatMessage[], opts: LlmCallOptions = {}): Promise<string> {
  const maxAttempts = 4;
  let attempt = 0;
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const conversation = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n\n");
  const userText = `${conversation}${schemaHint(opts)}`.trim();

  while (true) {
    try {
      const model = getGeminiClient().getGenerativeModel({
        model: getGeminiModel(),
        systemInstruction: system || undefined,
        generationConfig: {
          temperature: opts.temperature ?? 0.2,
          maxOutputTokens: opts.maxCompletionTokens ?? 8192,
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent(userText);
      return result.response.text();
    } catch (err) {
      const msg = String((err as { message?: string })?.message ?? "").toLowerCase();
      if (msg.includes("quota") || msg.includes("resource exhausted")) {
        throw new LlmQuotaError(formatLlmError(err));
      }
      attempt++;
      if (!isTransientRateLimit(err) || attempt >= maxAttempts) throw err;
      const backoff = Math.min(30_000, interRequestDelayMs() * 2 ** attempt);
      await sleep(backoff);
    }
  }
}

export async function waitBetweenRequests() {
  await sleep(interRequestDelayMs());
}

export function safeJsonParse(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
