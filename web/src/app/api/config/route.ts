import { NextResponse } from "next/server";
import { getActiveModelName, getLlmProvider, isLlmConfigured } from "@/services/llm/provider";

export const runtime = "nodejs";

export async function GET() {
  const provider = getLlmProvider();
  return NextResponse.json({
    ok: true,
    llmConfigured: isLlmConfigured(),
    llmProvider: provider,
    cerebrasConfigured: isLlmConfigured(),
    refreshAvailable: !process.env.VERCEL,
    model: getActiveModelName() ?? "not configured",
  });
}
