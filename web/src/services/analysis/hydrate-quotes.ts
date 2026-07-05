import type { EvidenceQuote, PMReport } from "@/types/analysis";
import type { NormalizedReview } from "@/types/reviews";
import { coerceEvidenceQuote, reviewToEvidenceQuote } from "@/lib/evidence-quote";

function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function findReviewForQuote(quote: string, reviews: NormalizedReview[]): NormalizedReview | undefined {
  const q = normalizeForMatch(quote);
  if (q.length < 12) return undefined;

  for (const len of [Math.min(q.length, 120), 80, 50, 30]) {
    const needle = q.slice(0, len);
    if (needle.length < 12) continue;
    for (const r of reviews) {
      const hay = normalizeForMatch(`${r.title ?? ""} ${r.body ?? ""}`);
      if (hay.includes(needle)) return r;
    }
  }
  return undefined;
}

/** Attach source, url, date, author from the review corpus when missing. */
export function hydrateEvidenceQuote(quote: EvidenceQuote, reviews: NormalizedReview[]): EvidenceQuote {
  if (quote.url && quote.source) return quote;
  const match = findReviewForQuote(quote.quote, reviews);
  if (!match) return quote;
  const fromReview = reviewToEvidenceQuote(match);
  return {
    quote: quote.quote.trim() || fromReview.quote,
    source: quote.source ?? fromReview.source,
    date: quote.date ?? fromReview.date,
    url: quote.url ?? fromReview.url,
    author: quote.author ?? fromReview.author,
  };
}

export function hydrateEvidenceQuotes(quotes: unknown[], reviews: NormalizedReview[]): EvidenceQuote[] {
  return quotes
    .map((q) => coerceEvidenceQuote(q))
    .filter((q): q is EvidenceQuote => q != null)
    .map((q) => hydrateEvidenceQuote(q, reviews))
    .filter((q) => q.quote.trim().length > 0);
}

function hydrateThemeLike<T extends { representativeQuotes?: unknown[] }>(items: T[], reviews: NormalizedReview[]): T[] {
  return items.map((item) => ({
    ...item,
    representativeQuotes: hydrateEvidenceQuotes(item.representativeQuotes ?? [], reviews),
  }));
}

function hydrateNamedQuotes<T extends Record<string, unknown>>(
  items: T[],
  key: string,
  reviews: NormalizedReview[],
): T[] {
  return items.map((item) => ({
    ...item,
    [key]: hydrateEvidenceQuotes((item[key] as unknown[]) ?? [], reviews),
  }));
}

export function hydrateReportQuotes(report: PMReport, reviews: NormalizedReview[]): PMReport {
  return {
    ...report,
    themes: hydrateThemeLike(report.themes, reviews),
    jtbds: report.jtbds.map((j) => ({
      ...j,
      examples: hydrateEvidenceQuotes(j.examples, reviews),
    })),
    painPoints: hydrateNamedQuotes(report.painPoints, "representativeQuotes", reviews),
    rootCauses: report.rootCauses.map((r) => ({
      ...r,
      evidenceQuotes: hydrateEvidenceQuotes(r.evidenceQuotes, reviews),
    })),
    segments: hydrateThemeLike(report.segments, reviews),
    opportunities: report.opportunities.map((o) => ({
      ...o,
      evidence: hydrateEvidenceQuotes(o.evidence, reviews),
    })),
    listeningBehaviours: (report.listeningBehaviours ?? []).map((b) => ({
      ...b,
      examples: hydrateEvidenceQuotes(b.examples, reviews),
    })),
    discoveryInsights: (report.discoveryInsights ?? []).map((insight) => ({
      ...insight,
      representativeQuotes: hydrateEvidenceQuotes(insight.representativeQuotes, reviews),
    })),
  };
}
