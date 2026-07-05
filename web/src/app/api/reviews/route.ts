import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { parseUploadedJson } from "@/lib/normalize";
import { jsonDataPath } from "@/lib/dataset";

export const runtime = "nodejs";

/** Serve full reviews dataset — read-only, no scraper, no auto-merge. */
export async function GET() {
  try {
    const raw = await readFile(jsonDataPath(), "utf-8");
    const json = JSON.parse(raw);
    const parsed = parseUploadedJson(json);
    return NextResponse.json({
      ok: true,
      meta: parsed.meta ?? {},
      total: parsed.reviews.length,
      reviews: parsed.reviews,
      rawMeta: {
        scraped_at: json.scraped_at ?? null,
        date_range: json.date_range ?? null,
        sources: json.sources ?? null,
        total_entries: json.total_entries ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dataset";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
