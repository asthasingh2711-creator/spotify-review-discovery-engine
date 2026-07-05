import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    cerebrasConfigured: Boolean(process.env.CEREBRAS_API_KEY?.trim()),
    refreshAvailable: !process.env.VERCEL,
    model: process.env.CEREBRAS_MODEL || "gemma-4-31b",
  });
}
