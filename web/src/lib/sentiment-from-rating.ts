import type { NormalizedReview } from "@/types/reviews";

export type RatingSentiment = "positive" | "neutral" | "negative";

export type RatingSort = "default" | "rating-desc" | "rating-asc" | "date-desc" | "date-asc";

export type RatingSentimentSplit = {
  positive: number;
  neutral: number;
  negative: number;
  unrated: number;
  totalRated: number;
  total: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
};

export function parseRating(review: NormalizedReview): number | null {
  const val = review.rating;
  if (val == null) return null;
  const n = typeof val === "number" ? val : Number.parseFloat(String(val));
  return Number.isFinite(n) ? n : null;
}

export function ratingToSentiment(rating: number): RatingSentiment {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

/** Sentiment split from star ratings (4–5 positive, 3 neutral, 1–2 negative). Percentages use rated reviews only. */
export function computeRatingSentimentSplit(reviews: NormalizedReview[]): RatingSentimentSplit {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let unrated = 0;

  for (const review of reviews) {
    const rating = parseRating(review);
    if (rating == null) {
      unrated++;
      continue;
    }
    const bucket = ratingToSentiment(rating);
    if (bucket === "positive") positive++;
    else if (bucket === "neutral") neutral++;
    else negative++;
  }

  const totalRated = positive + neutral + negative;
  const pct = (n: number) => (totalRated > 0 ? Math.round((n / totalRated) * 100) : 0);

  return {
    positive,
    neutral,
    negative,
    unrated,
    totalRated,
    total: reviews.length,
    positivePct: pct(positive),
    neutralPct: pct(neutral),
    negativePct: pct(negative),
  };
}

export function sortReviewsByRating(
  reviews: NormalizedReview[],
  sort: RatingSort,
): NormalizedReview[] {
  if (sort === "default") return reviews;

  const copy = [...reviews];
  copy.sort((a, b) => {
    if (sort === "rating-desc" || sort === "rating-asc") {
      const ra = parseRating(a);
      const rb = parseRating(b);
      const aVal = ra ?? (sort === "rating-desc" ? -1 : 99);
      const bVal = rb ?? (sort === "rating-desc" ? -1 : 99);
      return sort === "rating-desc" ? bVal - aVal : aVal - bVal;
    }
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return sort === "date-desc" ? db - da : da - db;
  });
  return copy;
}
