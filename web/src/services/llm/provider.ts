import { getGeminiClient, getGeminiModel } from "@/services/gemini/client";
import { getCerebrasClient, getCerebrasModel } from "@/services/cerebras/client";
import {
  callChatWithRetry,
  callGeminiWithRetry,
  type ChatMessage,
  type LlmCallOptions,
} from "@/services/analysis/llm";

export type LlmProvider = "gemini" | "cerebras";

export function getLlmProvider(): LlmProvider | null {
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.CEREBRAS_API_KEY?.trim()) return "cerebras";
  return null;
}

export function isLlmConfigured() {
  return getLlmProvider() != null;
}

export function getActiveModelName() {
  const provider = getLlmProvider();
  if (provider === "gemini") return getGeminiModel();
  if (provider === "cerebras") return getCerebrasModel();
  return null;
}

export async function callLlmWithRetry(messages: ChatMessage[], opts: LlmCallOptions = {}): Promise<string> {
  const provider = getLlmProvider();
  if (provider === "gemini") {
    return callGeminiWithRetry(messages, opts);
  }
  if (provider === "cerebras") {
    return callChatWithRetry(getCerebrasClient(), getCerebrasModel(), messages, opts);
  }
  throw new Error("No LLM API key configured. Set GEMINI_API_KEY or CEREBRAS_API_KEY.");
}
