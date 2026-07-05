import type { EvidenceQuote } from "@/types/analysis";
import { classifyReviewUrl, evidenceQuoteFromInlineText, sourceLinkLabel } from "@/lib/evidence-quote";

export function QuoteCitation({
  quote,
  compact = false,
}: {
  quote: EvidenceQuote | string;
  compact?: boolean;
}) {
  const q: EvidenceQuote = typeof quote === "string" ? evidenceQuoteFromInlineText(quote) : quote;
  const urlOk = q.url ? classifyReviewUrl(q.url).valid : false;

  return (
    <div className={`rounded-md border border-border bg-muted/20 ${compact ? "p-2.5" : "p-3"} text-sm`}>
      <p className="text-foreground leading-relaxed">"{q.quote}"</p>
      {(q.url || q.source || q.author) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {q.source && <span>{q.source}</span>}
          {q.author && <span>· {q.author}</span>}
          {q.date && <span>· {q.date.slice(0, 10)}</span>}
          {q.url && urlOk && (
            <a
              href={q.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium"
            >
              {sourceLinkLabel(q)} ↗
            </a>
          )}
          {q.url && !urlOk && <span className="text-yellow-600">Link unverified</span>}
        </div>
      )}
    </div>
  );
}
