import type { NormalizedReview } from "@/types/reviews";

/** Match reviews where any keyword appears in title, body, author, source, or url. */
export function filterReviewsByKeyword(reviews: NormalizedReview[], keyword: string): NormalizedReview[] {
  const query = keyword.trim().toLowerCase();
  if (!query) return reviews;

  const terms = query.split(/\s+/).filter(Boolean);
  return reviews.filter((r) => {
    const blob = `${r.title}\n${r.body}\n${r.author ?? ""}\n${r.source}\n${r.url ?? ""}`.toLowerCase();
    return terms.every((term) => blob.includes(term));
  });
}
