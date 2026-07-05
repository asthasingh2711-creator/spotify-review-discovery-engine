import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { jsonDataPath } from "@/lib/dataset";
import { loadDiscoveryDataset, persistDiscoveryDataset } from "@/lib/persistence";
import { parseUploadedJson } from "@/lib/normalize";

export const runtime = "nodejs";

export async function GET() {
  try {
    let data = await loadDiscoveryDataset();

    if (!data) {
      const raw = await readFile(jsonDataPath(), "utf-8");
      const json = JSON.parse(raw);
      const parsed = parseUploadedJson(json);
      await persistDiscoveryDataset(parsed.reviews);
      data = await loadDiscoveryDataset();
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Discovery dataset not available" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      total: data.reviews.length,
      reviews: data.reviews,
      meta: data.meta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load relevant reviews";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
