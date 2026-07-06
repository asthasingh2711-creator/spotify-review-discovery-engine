#!/usr/bin/env node
/**
 * Build downloadable review datasets under data/exports/
 * - Full dataset (3,776 reviews): JSON + CSV
 * - Discovery-curated (801 reviews): JSON + CSV
 * - ZIP bundle of all four files
 */
import { cpSync, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const dataDir = join(root, "data");
const exportsDir = join(dataDir, "exports");

const FULL_JSON = join(dataDir, "reviews_discussions.json");
const FULL_CSV = join(dataDir, "reviews_discussions.csv");
const DISCOVERY_JSON = join(dataDir, "reviews_discovery.json");

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function entriesToCsv(entries) {
  const header = ["id", "source", "type", "date", "rating", "title", "text", "author", "url"];
  const lines = [header.join(",")];
  for (const e of entries) {
    lines.push(
      [
        e.id,
        e.source,
        e.type,
        e.date,
        e.rating ?? "",
        e.title ?? "",
        e.text ?? "",
        e.author ?? "",
        e.url ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

function main() {
  if (!existsSync(FULL_JSON) || !existsSync(DISCOVERY_JSON)) {
    console.error("Missing data/reviews_discussions.json or data/reviews_discovery.json");
    process.exit(1);
  }

  mkdirSync(exportsDir, { recursive: true });

  const full = JSON.parse(readFileSync(FULL_JSON, "utf8"));
  const discovery = JSON.parse(readFileSync(DISCOVERY_JSON, "utf8"));

  const out = {
    fullJson: join(exportsDir, "spotify-reviews-full-3776.json"),
    fullCsv: join(exportsDir, "spotify-reviews-full-3776.csv"),
    discoveryJson: join(exportsDir, "spotify-reviews-discovery-801.json"),
    discoveryCsv: join(exportsDir, "spotify-reviews-discovery-801.csv"),
    zip: join(exportsDir, "spotify-reviews-export.zip"),
  };

  writeFileSync(out.fullJson, JSON.stringify(full, null, 2));
  writeFileSync(out.discoveryJson, JSON.stringify(discovery, null, 2));

  if (existsSync(FULL_CSV)) {
    cpSync(FULL_CSV, out.fullCsv);
  } else {
    writeFileSync(out.fullCsv, entriesToCsv(full.entries ?? []));
  }

  writeFileSync(out.discoveryCsv, entriesToCsv(discovery.entries ?? []));

  const readme = `# Spotify Review Discovery Engine — Data Export

Generated: ${new Date().toISOString()}

## Files

| File | Description |
|------|-------------|
| spotify-reviews-full-3776.json | All scraped reviews & discussions (${full.total_entries ?? full.entries?.length ?? "?"} entries) |
| spotify-reviews-full-3776.csv | Same full dataset, CSV |
| spotify-reviews-discovery-801.json | ETL-filtered discovery-relevant reviews (${discovery.total_relevant ?? discovery.entries?.length ?? "?"} entries) |
| spotify-reviews-discovery-801.csv | Same curated dataset, CSV |

## Columns (CSV)

id, source, type, date, rating, title, text, author, url

Sources: Play Store, App Store, Reddit, Spotify Community
`;
  writeFileSync(join(exportsDir, "README.md"), readme);

  try {
    execSync(
      `cd "${exportsDir}" && rm -f spotify-reviews-export.zip && zip -q spotify-reviews-export.zip spotify-reviews-full-3776.json spotify-reviews-full-3776.csv spotify-reviews-discovery-801.json spotify-reviews-discovery-801.csv README.md`,
      { stdio: "inherit" },
    );
  } catch {
    console.warn("[export] zip not created (install zip CLI or use individual files)");
  }

  const webDownloads = join(root, "web", "public", "downloads");
  mkdirSync(webDownloads, { recursive: true });
  for (const [name, src] of Object.entries({
    "spotify-reviews-full-3776.json": out.fullJson,
    "spotify-reviews-full-3776.csv": out.fullCsv,
    "spotify-reviews-discovery-801.json": out.discoveryJson,
    "spotify-reviews-discovery-801.csv": out.discoveryCsv,
    "spotify-reviews-export.zip": out.zip,
  })) {
    if (existsSync(src)) cpSync(src, join(webDownloads, name));
  }

  console.log("Export complete:");
  console.log(`  ${out.fullJson}`);
  console.log(`  ${out.fullCsv}`);
  console.log(`  ${out.discoveryJson}`);
  console.log(`  ${out.discoveryCsv}`);
  if (existsSync(out.zip)) console.log(`  ${out.zip}`);
  console.log(`  ${join(webDownloads, "*")}`);
}

main();
