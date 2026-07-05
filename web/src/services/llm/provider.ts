import { getGeminiClient, getGeminiModel } from "@/services/gemini/client";
import { getCerebrasClient, getCerebrasModel } from "@/services/cerebras/client";
import {
  callChatWithRetry,
  callGeminiWithRetry,
  LlmQuotaError,
  type ChatMessage,
  type LlmCallOptions,
} from "@/services/analysis/llm";

export type LlmProvider = "gemini" | "cerebras";

export function getAvailableProviders(): LlmProvider[] {
  const out: LlmProvider[] = [];
  if (process.env.GEMINI_API_KEY?.trim()) out.push("gemini");
  if (process.env.CEREBRAS_API_KEY?.trim()) out.push("cerebras");
  return out;
}

export function getLlmProvider(): LlmProvider | null {
  return getAvailableProviders()[0] ?? null;
}

export function isLlmConfigured() {
  return getAvailableProviders().length > 0;
}

export function getActiveModelName(provider?: LlmProvider | null) {
  const p = provider ?? getLlmProvider();
  if (p === "gemini") return getGeminiModel();
  if (p === "cerebras") return getCerebrasModel();
  return null;
}

async function callProvider(provider: LlmProvider, messages: ChatMessage[], opts: LlmCallOptions) {
  if (provider === "gemini") return callGeminiWithRetry(messages, opts);
  return callChatWithRetry(getCerebrasClient(), getCerebrasModel(), messages, opts);
}

/** Try each configured provider in order; on quota errors, fall back to the next. */
export async function callLlmWithRetry(
  messages: ChatMessage[],
  opts: LlmCallOptions = {},
): Promise<{ text: string; provider: LlmProvider }> {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    throw new Error("No LLM API key configured. Set GEMINI_API_KEY or CEREBRAS_API_KEY.");
  }

  let lastError: unknown;
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      const text = await callProvider(provider, messages, opts);
      return { text, provider };
    } catch (err) {
      lastError = err;
      const hasFallback = i < providers.length - 1;
      if (err instanceof LlmQuotaError && hasFallback) continue;
      throw err;
    }
  }
  throw lastError ?? new Error("All LLM providers failed.");
}
