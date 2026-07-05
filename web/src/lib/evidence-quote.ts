import type { EvidenceQuote } from "@/types/analysis";
import type { NormalizedReview } from "@/types/reviews";

const URL_PATTERNS: { source: string; test: RegExp }[] = [
  { source: "Play Store", test: /^https:\/\/play\.google\.com\/store\/apps\/details\?.*reviewId=/i },
  { source: "App Store", test: /^https:\/\/(itunes\.apple\.com|apps\.apple\.com)\/.*review/i },
  { source: "Reddit", test: /^https:\/\/(www\.)?reddit\.com\/r\//i },
  { source: "Spotify Community", test: /^https:\/\/community\.spotify\.com\//i },
];

export function quoteSnippet(text: string, max = 220): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max - 1)}…`;
}

export function reviewToEvidenceQuote(r: NormalizedReview, max = 220): EvidenceQuote {
  return {
    quote: quoteSnippet((r.body || r.title || "").trim(), max),
    source: r.source,
    date: r.date,
    url: r.url,
    author: r.author,
  };
}

export function evidenceQuotesFromReviews(reviews: NormalizedReview[], limit = 3, max = 220): EvidenceQuote[] {
  return reviews
    .filter((r) => (r.body || r.title || "").trim().length > 0)
    .slice(0, limit)
    .map((r) => reviewToEvidenceQuote(r, max));
}

export function coerceEvidenceQuote(value: unknown): EvidenceQuote | null {
  if (typeof value === "string") {
    const q = value.trim();
    return q ? { quote: q } : null;
  }
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const quote = String(o.quote ?? "").trim();
  if (!quote) return null;
  return {
    quote,
    source: o.source ? String(o.source) : undefined,
    date: o.date && String(o.date).trim() ? String(o.date) : undefined,
    url: o.url && String(o.url).trim() ? String(o.url) : undefined,
    author: o.author && String(o.author).trim() ? String(o.author) : undefined,
  };
}

export function coerceEvidenceQuotes(values: unknown): EvidenceQuote[] {
  if (!Array.isArray(values)) return [];
  return values.map(coerceEvidenceQuote).filter((q): q is EvidenceQuote => q != null);
}

export function classifyReviewUrl(url?: string): { valid: boolean; expectedSource?: string } {
  if (!url?.trim()) return { valid: false };
  const u = url.trim();
  for (const { source, test } of URL_PATTERNS) {
    if (test.test(u)) return { valid: true, expectedSource: source };
  }
  try {
    const host = new URL(u).hostname;
    return { valid: host.length > 0 };
  } catch {
    return { valid: false };
  }
}

export function sourceLinkLabel(q: EvidenceQuote): string {
  if (q.source && q.author) return `${q.source} · ${q.author}`;
  if (q.source) return q.source;
  if (q.url) {
    try {
      return new URL(q.url).hostname.replace(/^www\./, "");
    } catch {
      return "View source";
    }
  }
  return "View source";
}

export function parseInlineSourceText(text: string): { text: string; url?: string } {
  const trimmed = text.trim();
  const m = trimmed.match(/^(.*?)\s*\((https?:\/\/[^)]+)\)\s*$/);
  if (m) return { text: m[1].trim(), url: m[2].trim() };
  return { text: trimmed };
}

export function evidenceQuoteFromInlineText(text: string): EvidenceQuote {
  const { text: quote, url } = parseInlineSourceText(text);
  return { quote, url };
}

export function formatQuoteMarkdown(q: EvidenceQuote): string {
  const meta = [q.source, q.author, q.date?.slice(0, 10)].filter(Boolean).join(" · ");
  const quoteLine = `> "${q.quote}"`;
  if (q.url && classifyReviewUrl(q.url).valid) {
    return `${quoteLine}\n> — ${meta ? `${meta} · ` : ""}[View review](${q.url})`;
  }
  return meta ? `${quoteLine}\n> — ${meta}` : quoteLine;
}

export function textGist(text: string, max = 160): string {
  const s = text.trim();
  if (!s) return "";
  const sentenceEnd = s.search(/[.!?]\s/);
  if (sentenceEnd > 20 && sentenceEnd < max) return s.slice(0, sentenceEnd + 1);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
