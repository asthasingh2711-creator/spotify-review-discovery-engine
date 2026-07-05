import type { NormalizedReview } from "@/types/reviews";

/** Inclusion: discovery, recommendation, playlists, etc. */
const INCLUDE_TERMS = [
  "discovery",
  "discover",
  "recommend",
  "recommendation",
  "playlist",
  "ai dj",
  "dj mode",
  "search",
  "radio",
  "shuffle",
  "smart shuffle",
  "similar artist",
  "similar artists",
  "mood",
  "genre",
  "genres",
  "repeat listening",
  "repetitive",
  "same song",
  "same songs",
  "same artist",
  "familiar",
  "explore",
  "discover weekly",
  "release radar",
  "daylist",
  "mix",
  "mixes",
  "blend",
  "queue",
  "home feed",
  "home page",
  "for you",
  "made for you",
  "autoplay",
  "algorithm",
  "suggestion",
  "suggestions",
  "new music",
  "new artist",
  "wrapped",
  "personalization",
  "skip",
  "stale",
  "bored",
];

/** Exclusion unless also discovery-related */
const EXCLUDE_TERMS = [
  "billing",
  "refund",
  "charge",
  "payment",
  "premium migration",
  "migrate",
  "login",
  "password",
  "sign in",
  "account hack",
  "android 17",
  "crash",
  "crashes",
  "force close",
  "customer service",
];

const AD_TERMS = ["ads", "advertisement", "commercial"];

const DISCOVERY_AD_TERMS = ["recommend", "playlist", "discover", "shuffle", "radio", "dj", "algorithm"];

function reviewText(r: NormalizedReview) {
  return `${r.title}\n${r.body}`.toLowerCase();
}

function hasTerm(text: string, terms: string[]) {
  return terms.some((t) => text.includes(t));
}

export function isDiscoveryRelevantReview(r: NormalizedReview): boolean {
  const text = reviewText(r);

  if (hasTerm(text, INCLUDE_TERMS)) return true;

  if (hasTerm(text, EXCLUDE_TERMS) && !hasTerm(text, INCLUDE_TERMS)) return false;

  if (hasTerm(text, AD_TERMS)) {
    return hasTerm(text, DISCOVERY_AD_TERMS);
  }

  return false;
}

export type EtlResult = {
  relevant: NormalizedReview[];
  totalInput: number;
  totalRelevant: number;
  excluded: number;
  sources: Record<string, number>;
  etlAt: string;
};

export function runDiscoveryEtl(reviews: NormalizedReview[]): EtlResult {
  const relevant = reviews.filter(isDiscoveryRelevantReview);
  const sources: Record<string, number> = {};
  for (const r of relevant) {
    sources[r.source] = (sources[r.source] ?? 0) + 1;
  }
  return {
    relevant,
    totalInput: reviews.length,
    totalRelevant: relevant.length,
    excluded: reviews.length - relevant.length,
    sources,
    etlAt: new Date().toISOString(),
  };
}
