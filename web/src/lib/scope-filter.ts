import type { NormalizedReview } from "@/types/reviews";
import { isDiscoveryRelevantReview } from "@/lib/etl/discovery-etl";
import type { AnalysisScope } from "@/types/analysis";

export function isDiscoveryRelevant(r: NormalizedReview): boolean {
  return isDiscoveryRelevantReview(r);
}

export function filterByScope(reviews: NormalizedReview[], scope: AnalysisScope): NormalizedReview[] {
  if (scope === "all") return reviews;
  return reviews.filter(isDiscoveryRelevantReview);
}
