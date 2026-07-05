import type { NormalizedReview } from "@/types/reviews";

const DEFAULT_SAMPLE_SIZE = 80;

/** Stratified sample across sources so all platforms are represented in the LLM pass. */
export function stratifiedSample(reviews: NormalizedReview[], targetSize = DEFAULT_SAMPLE_SIZE): NormalizedReview[] {
  if (reviews.length <= targetSize) return reviews;

  const bySource = new Map<string, NormalizedReview[]>();
  for (const r of reviews) {
    const key = r.source || "Unknown";
    const list = bySource.get(key) ?? [];
    list.push(r);
    bySource.set(key, list);
  }

  const sources = [...bySource.keys()];
  const perSource = Math.max(1, Math.floor(targetSize / sources.length));
  const picked: NormalizedReview[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    const pool = bySource.get(source) ?? [];
    const step = Math.max(1, Math.floor(pool.length / perSource));
    for (let i = 0; i < pool.length && picked.length < targetSize; i += step) {
      const r = pool[i];
      if (!seen.has(r.id)) {
        seen.add(r.id);
        picked.push(r);
      }
      if ([...bySource.keys()].indexOf(source) === sources.length - 1) break;
      if (picked.filter((x) => x.source === source).length >= perSource) break;
    }
  }

  if (picked.length < targetSize) {
    for (const r of reviews) {
      if (picked.length >= targetSize) break;
      if (!seen.has(r.id)) {
        seen.add(r.id);
        picked.push(r);
      }
    }
  }

  return picked.slice(0, targetSize);
}
