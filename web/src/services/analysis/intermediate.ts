import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type IntermediateRunMeta = {
  runId: string;
  startedAt: string;
  totalChunks: number;
  completedChunks: number;
  chunkFiles: string[];
};

function intermediateRoot() {
  return path.resolve(process.cwd(), "..", "data", "analysis", "intermediate");
}

export function createRunId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function ensureIntermediateDir(runId: string) {
  const dir = path.join(intermediateRoot(), runId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function saveChunkOutput(runId: string, chunkIndex: number, payload: unknown) {
  const dir = await ensureIntermediateDir(runId);
  const filename = `chunk-${String(chunkIndex + 1).padStart(3, "0")}.json`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
  return { filePath, filename };
}

export async function saveRunManifest(runId: string, meta: IntermediateRunMeta) {
  const dir = await ensureIntermediateDir(runId);
  const filePath = path.join(dir, "manifest.json");
  await writeFile(filePath, JSON.stringify(meta, null, 2), "utf-8");
  return filePath;
}

export async function saveAggregatedOutput(runId: string, payload: unknown) {
  const dir = await ensureIntermediateDir(runId);
  const filePath = path.join(dir, "aggregated.json");
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
  return filePath;
}
