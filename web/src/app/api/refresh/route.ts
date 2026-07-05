import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { parseUploadedJson } from "@/lib/normalize";
import { persistDiscoveryDataset } from "@/lib/persistence";
import {
  ensureFullDataset,
  jsonDataPath,
  persistMergedPayload,
  readCsvEntries,
  readJsonPayload,
} from "@/lib/dataset";

export const runtime = "nodejs";
export const maxDuration = 600;

const execFileAsync = promisify(execFile);

function isVercel() {
  return Boolean(process.env.VERCEL);
}

function parentDir() {
  return path.resolve(process.cwd(), "..");
}

type AnyEntry = Record<string, any>;

async function resolvePython() {
  const pyVenv = path.join(parentDir(), ".venv", "bin", "python");
  try {
    await access(pyVenv, constants.X_OK);
    return pyVenv;
  } catch {
    return "python3";
  }
}

export async function POST() {
  if (isVercel()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Refresh is disabled on Vercel because it requires running the local Python scrapers and writing to disk. Run locally to use Refresh.",
      },
      { status: 501 },
    );
  }

  try {
    // Heal from CSV baseline before scraping so historical rows are never lost.
    await ensureFullDataset();
    const beforeJson = await readJsonPayload();
    const csvEntries = await readCsvEntries();

    const python = await resolvePython();
    await execFileAsync(python, ["-m", "scraper.scrape_all"], {
      cwd: parentDir(),
      timeout: 10 * 60 * 1000,
      env: process.env,
    });

    const raw = await readFile(jsonDataPath(), "utf-8");
    const latest = JSON.parse(raw);
    const latestEntries: AnyEntry[] = Array.isArray(latest?.entries) ? latest.entries : [];

    const merged = await persistMergedPayload(beforeJson, csvEntries, latestEntries, {
      last_refresh: new Date().toISOString(),
    });

    const parsed = parseUploadedJson(merged);
    const etl = await persistDiscoveryDataset(parsed.reviews);
    const meta = merged as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      rawMeta: {
        scraped_at: meta.scraped_at ?? null,
        date_range: meta.date_range ?? null,
        sources: meta.sources ?? null,
        total_entries: meta.total_entries ?? null,
      },
      total: parsed.reviews.length,
      discoveryTotal: etl.totalRelevant,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
