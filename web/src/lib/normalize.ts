import { z } from "zod";
import type { NormalizedReview, ReviewSource, ReviewType, UploadedDataset } from "@/types/reviews";

const AnyRecord = z.record(z.string(), z.unknown());

const ReviewLike = z
  .object({
    id: z.string().optional(),
    source: z.string().optional(),
    platform: z.string().optional(),
    type: z.string().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
    text: z.string().optional(),
    content: z.string().optional(),
    rating: z.number().optional(),
    score: z.number().optional(),
    date: z.string().optional(),
    created_at: z.string().optional(),
    at: z.string().optional(),
    url: z.string().optional(),
    link: z.string().optional(),
    author: z.string().optional(),
    user: z.string().optional(),
  })
  .passthrough();

const DatasetShapeA = z
  .object({
    entries: z.array(AnyRecord).optional(),
    reviews: z.array(AnyRecord).optional(),
    meta: AnyRecord.optional(),
    scraped_at: z.string().optional(),
    date_range: AnyRecord.optional(),
  })
  .passthrough();

function coerceSource(s?: string): ReviewSource {
  const v = (s ?? "").toLowerCase();
  if (v.includes("app store") || v.includes("apple")) return "App Store";
  if (v.includes("play store") || v.includes("google")) return "Play Store";
  if (v.includes("reddit")) return "Reddit";
  if (v.includes("community")) return "Spotify Community";
  if (v.includes("social")) return "Social Media";
  if (!v) return "Unknown";
  return "Unknown";
}

function coerceType(t?: string): ReviewType {
  const v = (t ?? "").toLowerCase();
  if (v === "review") return "review";
  if (v === "discussion") return "discussion";
  if (v === "comment") return "comment";
  if (v === "post") return "post";
  return "unknown";
}

function stableId(seed: string): string {
  // small deterministic id for client-side usage (not crypto)
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return `r_${(h >>> 0).toString(16)}`;
}

function normalizeOne(raw: unknown, idx: number): NormalizedReview | null {
  const parsed = ReviewLike.safeParse(raw);
  if (!parsed.success) return null;
  const r = parsed.data;

  const title = r.title ?? "";
  const body = r.body ?? r.text ?? r.content ?? "";
  const date = r.date ?? r.created_at ?? r.at;
  const url = r.url ?? r.link;
  const source = coerceSource(r.source ?? r.platform);

  const rating =
    typeof r.rating === "number"
      ? r.rating
      : typeof r.score === "number" && r.score >= 0 && r.score <= 5
        ? r.score
        : undefined;

  const id =
    r.id ??
    stableId(
      [
        source,
        r.type ?? "",
        date ?? "",
        url ?? "",
        title.slice(0, 80),
        body.slice(0, 200),
        String(idx),
      ].join("|"),
    );

  return {
    id,
    source,
    platform: r.platform,
    type: coerceType(r.type),
    title: (title || "").trim(),
    body: (body || "").trim(),
    rating,
    date,
    url,
    author: r.author ?? r.user,
    raw,
  };
}

export function parseUploadedJson(input: unknown): UploadedDataset {
  const dataset = DatasetShapeA.safeParse(input);
  if (!dataset.success) {
    // if it's just an array of reviews
    const arr = z.array(AnyRecord).safeParse(input);
    if (arr.success) {
      const reviews = arr.data
        .map((x, i) => normalizeOne(x, i))
        .filter((x): x is NormalizedReview => Boolean(x))
        .filter((x) => x.title.length > 0 || x.body.length > 0);
      return { reviews };
    }
    return { meta: { error: "Invalid JSON structure" }, reviews: [] };
  }

  const d = dataset.data;
  const rows = (d.entries ?? d.reviews ?? []) as unknown[];
  const reviews = rows
    .map((x, i) => normalizeOne(x, i))
    .filter((x): x is NormalizedReview => Boolean(x))
    .filter((x) => x.title.length > 0 || x.body.length > 0);

  return {
    meta: {
      ...(d.meta ?? {}),
      scraped_at: d.scraped_at,
      date_range: d.date_range,
    },
    reviews,
  };
}

