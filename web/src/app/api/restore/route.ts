import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { parseUploadedJson } from "@/lib/normalize";
import { persistDiscoveryDataset } from "@/lib/persistence";
import {
  jsonDataPath,
  persistMergedPayload,
  readCsvEntries,
  readJsonPayload,
} from "@/lib/dataset";

export const runtime = "nodejs";

function isVercel() {
  return Boolean(process.env.VERCEL);
}

export async function POST() {
  if (isVercel()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Restore is disabled on Vercel because it requires reading local CSV and writing to disk. Run locally to use Restore.",
      },
      { status: 501 },
    );
  }

  try {
    const beforeJson = await readJsonPayload();
    const beforeCount = Array.isArray(beforeJson?.entries) ? beforeJson!.entries.length : 0;
    const csvEntries = await readCsvEntries();

    const merged = await persistMergedPayload(beforeJson, csvEntries, [], {
      restore: {
        at: new Date().toISOString(),
        from_csv_rows: csvEntries.length,
        before_entries: beforeCount,
        after_entries: 0,
        added: 0,
      },
    });
    const payload = merged as Record<string, any>;
    if (payload.meta?.restore) {
      payload.meta.restore.after_entries = payload.total_entries;
      payload.meta.restore.added = Math.max(0, payload.total_entries - beforeCount);
    }
    await writeFile(jsonDataPath(), JSON.stringify(payload, null, 2), "utf-8");

    const parsed = parseUploadedJson(payload);
    const etl = await persistDiscoveryDataset(parsed.reviews);
    const meta = payload;
    return NextResponse.json({
      ok: true,
      rawMeta: {
        scraped_at: meta.scraped_at ?? null,
        date_range: meta.date_range ?? null,
        sources: meta.sources ?? null,
        total_entries: meta.total_entries ?? null,
        restore: (meta.meta as Record<string, unknown> | undefined)?.restore ?? null,
      },
      total: parsed.reviews.length,
      discoveryTotal: etl.totalRelevant,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Restore failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
