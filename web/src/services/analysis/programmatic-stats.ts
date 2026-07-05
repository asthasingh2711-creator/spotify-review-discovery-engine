import { computeRatingSentimentSplit } from "@/lib/sentiment-from-rating";
import type { NormalizedReview } from "@/types/reviews";

const THEME_KEYWORDS: Record<string, string[]> = {
  recommendations: ["recommend", "suggestion", "algorithm", "discover weekly", "release radar"],
  playlists: ["playlist", "mix", "blend", "queue"],
  search: ["search", "find music"],
  shuffle: ["shuffle", "repeat", "same song", "repetitive"],
  radio: ["radio", "autoplay"],
  "ai dj": ["ai dj", "dj"],
  explore: ["explore", "new music", "discovery"],
  home_feed: ["home", "feed", "for you"],
};

export function buildProgrammaticStats(reviews: NormalizedReview[]) {
  const sources: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  for (const r of reviews) {
    sources[r.source] = (sources[r.source] ?? 0) + 1;
    typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;
    const blob = `${r.title} ${r.body}`.toLowerCase();
    for (const [theme, terms] of Object.entries(THEME_KEYWORDS)) {
      if (terms.some((t) => blob.includes(t))) {
        themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
      }
    }
  }

  const ratingSentiment = computeRatingSentimentSplit(reviews);
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme, count]) => ({ theme, count, share: count / reviews.length }));

  return {
    totalReviews: reviews.length,
    sources,
    typeCounts,
    topThemes,
    ratingSentiment: {
      positivePct: ratingSentiment.positivePct,
      neutralPct: ratingSentiment.neutralPct,
      negativePct: ratingSentiment.negativePct,
      totalRated: ratingSentiment.totalRated,
    },
  };
}
