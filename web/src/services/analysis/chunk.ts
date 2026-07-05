import type { NormalizedReview } from "@/types/reviews";

const DEFAULT_MIN_REVIEWS = 20;
const DEFAULT_MAX_REVIEWS = 30;
const DEFAULT_MAX_CHARS = 10_000;

export function reviewsToText(r: NormalizedReview, maxBodyChars = 1200): string {
  const body = (r.body || "(none)").slice(0, maxBodyChars);
  const parts = [
    `id: ${r.id}`,
    `source: ${r.source}`,
    r.platform ? `platform: ${r.platform}` : null,
    `type: ${r.type}`,
    r.rating != null ? `rating: ${r.rating}` : null,
    r.date ? `date: ${r.date}` : null,
    r.url ? `url: ${r.url}` : null,
    r.author ? `author: ${r.author}` : null,
    `title: ${r.title || "(none)"}`,
    `body: ${body}`,
  ].filter(Boolean);
  return parts.join("\n");
}

export function reviewTextLength(r: NormalizedReview): number {
  return reviewsToText(r).length + 8;
}

export type ChunkOptions = {
  minReviews?: number;
  maxReviews?: number;
  maxChars?: number;
};

/** Split reviews into ~20–30 items or ~8k–12k characters per chunk. */
export function chunkReviews(
  reviews: NormalizedReview[],
  opts: ChunkOptions = {},
): NormalizedReview[][] {
  const minReviews = opts.minReviews ?? DEFAULT_MIN_REVIEWS;
  const maxReviews = opts.maxReviews ?? DEFAULT_MAX_REVIEWS;
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;

  const chunks: NormalizedReview[][] = [];
  let current: NormalizedReview[] = [];
  let currentChars = 0;

  for (const review of reviews) {
    const len = reviewTextLength(review);
    const hitCountLimit = current.length >= maxReviews;
    const hitCharLimit = current.length >= minReviews && currentChars + len > maxChars;

    if (current.length > 0 && (hitCountLimit || hitCharLimit)) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(review);
    currentChars += len;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

/** @deprecated use chunkReviews with options */
export function chunkReviewsByCount(reviews: NormalizedReview[], maxPerChunk = 40): NormalizedReview[][] {
  return chunkReviews(reviews, { maxReviews: maxPerChunk, minReviews: 1, maxChars: Number.MAX_SAFE_INTEGER });
}
