import { NextResponse } from "next/server";
import {
  getActiveModelName,
  getAvailableProviders,
  getLlmProvider,
  isLlmConfigured,
} from "@/services/llm/provider";

export const runtime = "nodejs";

export async function GET() {
  const available = getAvailableProviders();
  const primary = getLlmProvider();
  return NextResponse.json({
    ok: true,
    llmConfigured: isLlmConfigured(),
    llmProvider: primary,
    llmProviders: available,
    llmFallbackAvailable: available.length > 1,
    cerebrasConfigured: isLlmConfigured(),
    refreshAvailable: !process.env.VERCEL,
    model: getActiveModelName(primary) ?? "not configured",
  });
}
