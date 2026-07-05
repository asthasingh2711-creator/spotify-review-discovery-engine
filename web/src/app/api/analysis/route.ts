import { NextResponse } from "next/server";
import { loadAnalysisResult } from "@/lib/persistence";

export const runtime = "nodejs";

export async function GET() {
  try {
    const saved = await loadAnalysisResult();
    if (!saved) {
      return NextResponse.json({ ok: true, hasAnalysis: false });
    }
    return NextResponse.json({
      ok: true,
      hasAnalysis: true,
      report: saved.report,
      warnings: saved.warnings ?? [],
      runId: saved.runId ?? null,
      savedAt: saved.savedAt ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load analysis";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
