import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { bundledFilePath } from "@/lib/data-dir";

export const runtime = "nodejs";

type Dataset = "full" | "discovery";
type Format = "json" | "csv" | "zip";

const FILES: Record<Dataset, Record<Format, string>> = {
  full: {
    json: "exports/spotify-reviews-full-3776.json",
    csv: "exports/spotify-reviews-full-3776.csv",
    zip: "exports/spotify-reviews-export.zip",
  },
  discovery: {
    json: "exports/spotify-reviews-discovery-801.json",
    csv: "exports/spotify-reviews-discovery-801.csv",
    zip: "exports/spotify-reviews-export.zip",
  },
};

const MIME: Record<Format, string> = {
  json: "application/json",
  csv: "text/csv; charset=utf-8",
  zip: "application/zip",
};

async function loadExport(relativePath: string) {
  return readFile(bundledFilePath(relativePath));
}

/** GET /api/export/reviews?dataset=full|discovery&format=json|csv  — or format=zip for bundle */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dataset = (searchParams.get("dataset") ?? "full") as Dataset;
  const format = (searchParams.get("format") ?? "json") as Format;

  if (!FILES[dataset] || !MIME[format]) {
    return NextResponse.json(
      {
        error: "Invalid dataset or format",
        usage: {
          full: "/api/export/reviews?dataset=full&format=json|csv",
          discovery: "/api/export/reviews?dataset=discovery&format=json|csv",
          zip: "/api/export/reviews?format=zip",
        },
      },
      { status: 400 },
    );
  }

  const rel = format === "zip" ? FILES.full.zip : FILES[dataset][format];
  const filename = path.basename(rel);

  try {
    const body = await loadExport(rel);
    return new NextResponse(body, {
      headers: {
        "Content-Type": MIME[format],
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Export file not found. Run: node scripts/export-review-datasets.mjs" },
      { status: 404 },
    );
  }
}
