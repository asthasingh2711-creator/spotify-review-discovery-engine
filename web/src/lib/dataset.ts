import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { mergeEntries, type AnyEntry } from "@/lib/mergeEntries";
import { bundledDataDir, dataDir } from "@/lib/data-dir";

export { bundledDataDir, dataDir };

export function jsonDataPath() {
  return path.join(bundledDataDir(), "reviews_discussions.json");
}

export function csvDataPath() {
  return path.join(bundledDataDir(), "reviews_discussions.csv");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }

  out.push(cur);
  return out;
}

function parseCsv(raw: string): { header: string[]; rows: string[][] } {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { header: [], rows: [] };

  const header = parseCsvLine(lines[0]).map((s) => s.trim());
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  return { header, rows };
}

export function csvRowsToEntries(csvRaw: string): AnyEntry[] {
  const { header, rows } = parseCsv(csvRaw);
  if (header.length === 0) return [];

  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    idx[h.trim().toLowerCase()] = i;
  });

  const get = (row: string[], name: string) => {
    const i = idx[name];
    if (typeof i !== "number") return undefined;
    const v = row[i];
    if (v == null) return undefined;
    const s = String(v).trim();
    return s.length ? s : undefined;
  };

  const out: AnyEntry[] = [];
  for (const row of rows) {
    const id = get(row, "id");
    const source = get(row, "source");
    const type = get(row, "type");
    const date = get(row, "date");
    const title = get(row, "title");
    const text = get(row, "text");
    const author = get(row, "author");
    const url = get(row, "url");
    const ratingRaw = get(row, "rating");
    const rating =
      ratingRaw != null && ratingRaw !== "" && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : undefined;

    if (!title && !text) continue;

    out.push({ id, source, type, date, rating, title, text, author, url });
  }
  return out;
}

export function countSources(entries: AnyEntry[]) {
  const sources: Record<string, number> = {};
  for (const e of entries) {
    const s = String(e.source ?? "Unknown");
    sources[s] = (sources[s] ?? 0) + 1;
  }
  return sources;
}

export async function readCsvEntries() {
  try {
    const csvRaw = await readFile(csvDataPath(), "utf-8");
    return csvRowsToEntries(csvRaw);
  } catch {
    return [];
  }
}

export async function readJsonPayload(): Promise<AnyEntry | null> {
  try {
    const raw = await readFile(jsonDataPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Merge CSV baseline + current JSON so historical rows are never lost. */
export function buildMergedPayload(currentJson: AnyEntry | null, csvEntries: AnyEntry[], extra: AnyEntry[] = []) {
  const currentEntries: AnyEntry[] = Array.isArray(currentJson?.entries) ? currentJson.entries : [];
  // CSV first (historical baseline), then JSON extras, then any new scrape batch.
  const mergedEntries = mergeEntries(mergeEntries(csvEntries, currentEntries), extra);

  return {
    ...(currentJson ?? {}),
    entries: mergedEntries,
    total_entries: mergedEntries.length,
    sources: countSources(mergedEntries),
  } as AnyEntry & {
    entries: AnyEntry[];
    total_entries: number;
    sources: Record<string, number>;
    meta?: Record<string, unknown>;
    scraped_at?: string;
    date_range?: unknown;
  };
}

/**
 * If JSON has fewer entries than the CSV baseline, merge CSV back in and persist.
 * Returns the healed payload (may be unchanged).
 */
export async function ensureFullDataset(): Promise<{ payload: AnyEntry; healed: boolean; csvBaseline: number }> {
  const csvEntries = await readCsvEntries();
  const currentJson = await readJsonPayload();
  const currentEntries: AnyEntry[] = Array.isArray(currentJson?.entries) ? currentJson!.entries : [];
  const csvBaseline = csvEntries.length;

  const merged = buildMergedPayload(currentJson, csvEntries);
  const healed = merged.entries.length > currentEntries.length;

  if (healed) {
    await writeFile(jsonDataPath(), JSON.stringify(merged, null, 2), "utf-8");
  }

  return { payload: healed ? merged : (currentJson ?? merged), healed, csvBaseline };
}

export async function persistMergedPayload(
  currentJson: AnyEntry | null,
  csvEntries: AnyEntry[],
  extra: AnyEntry[],
  metaPatch?: Record<string, unknown>,
) {
  const merged = buildMergedPayload(currentJson, csvEntries, extra);
  if (metaPatch) {
    merged.meta = { ...((currentJson ?? {})?.meta ?? {}), ...metaPatch };
  }
  await writeFile(jsonDataPath(), JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}
