import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseUploadedJson } from "@/lib/normalize";
import { runDiscoveryEtl } from "@/lib/etl/discovery-etl";
import { bundledDataDir, bundledFilePath, writableDataDir } from "@/lib/data-dir";
import type { NormalizedReview } from "@/types/reviews";

function discoveryPathIn(dir: string) {
  return path.join(dir, "reviews_discovery.json");
}

function analysisPathIn(dir: string) {
  return path.join(dir, "analysis", "analysis.json");
}

async function readJsonFile(filePath: string) {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function firstExistingJson(paths: string[]) {
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      return await readJsonFile(p);
    } catch {
      // try next
    }
  }
  return null;
}

export function discoveryDataPath() {
  return discoveryPathIn(writableDataDir());
}

export function analysisDataPath() {
  return analysisPathIn(writableDataDir());
}

export async function persistDiscoveryDataset(reviews: NormalizedReview[]) {
  const etl = runDiscoveryEtl(reviews);
  const dir = writableDataDir();
  await mkdir(dir, { recursive: true });

  const payload = {
    etl_at: etl.etlAt,
    total_input: etl.totalInput,
    total_relevant: etl.totalRelevant,
    excluded: etl.excluded,
    sources: etl.sources,
    entries: etl.relevant.map((r) => r.raw ?? r),
  };

  await writeFile(discoveryPathIn(dir), JSON.stringify(payload, null, 2), "utf-8");
  return etl;
}

export async function loadDiscoveryDataset() {
  const json = await firstExistingJson([
    discoveryPathIn(writableDataDir()),
    discoveryPathIn(bundledDataDir()),
  ]);
  if (!json) return null;

  const parsed = parseUploadedJson(json);
  return {
    reviews: parsed.reviews,
    meta: {
      etl_at: json.etl_at ?? null,
      total_input: json.total_input ?? null,
      total_relevant: json.total_relevant ?? parsed.reviews.length,
      excluded: json.excluded ?? null,
      sources: json.sources ?? null,
    },
  };
}

export async function persistAnalysisResult(payload: unknown) {
  const dir = path.join(writableDataDir(), "analysis");
  await mkdir(dir, { recursive: true });
  await writeFile(analysisPathIn(writableDataDir()), JSON.stringify(payload, null, 2), "utf-8");
}

export async function loadAnalysisResult() {
  return firstExistingJson([
    analysisPathIn(writableDataDir()),
    analysisPathIn(bundledDataDir()),
    bundledFilePath("analysis", "analysis.json"),
  ]);
}
