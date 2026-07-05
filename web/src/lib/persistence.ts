import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseUploadedJson } from "@/lib/normalize";
import { runDiscoveryEtl } from "@/lib/etl/discovery-etl";
import type { NormalizedReview } from "@/types/reviews";

function dataDir() {
  return path.resolve(process.cwd(), "..", "data");
}

export function discoveryDataPath() {
  return path.join(dataDir(), "reviews_discovery.json");
}

export function analysisDataPath() {
  return path.join(dataDir(), "analysis", "analysis.json");
}

export async function persistDiscoveryDataset(reviews: NormalizedReview[]) {
  const etl = runDiscoveryEtl(reviews);
  await mkdir(dataDir(), { recursive: true });

  const payload = {
    etl_at: etl.etlAt,
    total_input: etl.totalInput,
    total_relevant: etl.totalRelevant,
    excluded: etl.excluded,
    sources: etl.sources,
    entries: etl.relevant.map((r) => r.raw ?? r),
  };

  await writeFile(discoveryDataPath(), JSON.stringify(payload, null, 2), "utf-8");
  return etl;
}

export async function loadDiscoveryDataset() {
  try {
    const raw = await readFile(discoveryDataPath(), "utf-8");
    const json = JSON.parse(raw);
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
  } catch {
    return null;
  }
}

export async function persistAnalysisResult(payload: unknown) {
  const dir = path.join(dataDir(), "analysis");
  await mkdir(dir, { recursive: true });
  await writeFile(analysisDataPath(), JSON.stringify(payload, null, 2), "utf-8");
}

export async function loadAnalysisResult() {
  try {
    const raw = await readFile(analysisDataPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
