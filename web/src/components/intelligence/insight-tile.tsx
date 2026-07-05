"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { QuoteCitation } from "@/components/intelligence/quote-citation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DiscoveryInsight } from "@/types/analysis";

export function stripSoWhatPrefix(text?: string) {
  if (!text) return undefined;
  return text.replace(/^So what:\s*/i, "").trim();
}

function firstSentence(text: string, max = 220): string {
  const s = text.trim();
  const end = s.search(/[.!?](?:\s|$)/);
  if (end > 20 && end < max) return s.slice(0, end + 1);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function isAcrossIntro(text: string): boolean {
  return /^Across \d+ reviews/i.test(text.trim()) || /patterns consistent with/i.test(text);
}

function isBoilerplateRootCause(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.startsWith("users repeatedly describe recommendation fatigue") ||
    t.startsWith("repetitive listening is often a symptom") ||
    t.startsWith("the home feed appears optimized")
  );
}

/** Card headline — question-specific; never reuse generic root-cause copy across tiles. */
function insightCardTitle(insight: DiscoveryInsight): string {
  if (insight.gist?.trim() && !isBoilerplateRootCause(insight.gist)) {
    return firstSentence(insight.gist);
  }

  const finding = insight.finding?.trim();
  if (finding && !isBoilerplateRootCause(finding)) {
    if (isAcrossIntro(finding)) {
      const theme = finding.match(/Primary theme: ([^.]+)/i)?.[1]
        ?? finding.match(/Strongest signal: ([^.]+)/i)?.[1]
        ?? finding.match(/Top theme: ([^.]+)/i)?.[1]
        ?? finding.match(/Dominant behaviour cluster: ([^.]+)/i)?.[1]
        ?? finding.match(/Leading barrier: ([^.]+)/i)?.[1];
      if (theme) {
        return `${theme.charAt(0).toUpperCase() + theme.slice(1)} — recurring in ${insight.evidenceCount.toLocaleString()} reviews.`;
      }
      const cleaned = finding
        .replace(/^Across [\d,]+ reviews \(\d+% of the discovery dataset\),?\s*/i, "")
        .replace(/users describe patterns consistent with "[^"]+"\.\s*/i, "")
        .trim();
      if (cleaned.length > 40) return firstSentence(cleaned);
    } else {
      return firstSentence(finding);
    }
  }

  if (insight.evidenceSummary[0]) {
    return `${insight.evidenceSummary[0]} — ${insight.evidenceCount.toLocaleString()} mentions in reviews answering this question.`;
  }

  if (insight.inferredBehaviour && !isBoilerplateRootCause(insight.inferredBehaviour)) {
    return firstSentence(insight.inferredBehaviour);
  }

  return firstSentence(insight.question.replace(/\?$/, "."));
}

function datasetCoverageLine(insight: DiscoveryInsight, totalReviews?: number): string | null {
  const source = insight.finding ?? insight.gist ?? "";
  const across = source.match(/Across (\d[\d,]*) reviews \((\d+)% of the discovery dataset\)/i);
  if (across) {
    return `Across ${across[1]} reviews (${across[2]}% of dataset)`;
  }

  const inline = source.match(/(\d[\d,]*) reviews \((\d+)%\)/);
  if (inline) {
    return `Across ${inline[1]} reviews (${inline[2]}% of dataset)`;
  }

  if (insight.evidenceCount > 0) {
    const pct =
      totalReviews && totalReviews > 0
        ? Math.round((insight.evidenceCount / totalReviews) * 100)
        : undefined;
    return pct != null
      ? `Across ${insight.evidenceCount.toLocaleString()} reviews (${pct}% of dataset)`
      : `Across ${insight.evidenceCount.toLocaleString()} reviews`;
  }

  return null;
}

function insightSectionBody(insight: DiscoveryInsight, title: string): string | null {
  const finding = (insight.finding ?? insight.answer)?.trim();
  if (!finding) {
    return insight.inferredBehaviour ?? insight.rootCause ?? null;
  }

  if (isAcrossIntro(finding)) {
    const cleaned = finding
      .replace(/^Across \d+ reviews \([^)]+\)[^.]*\.\s*/i, "")
      .replace(/patterns consistent with "[^"]+"\.\s*/i, "")
      .replace(/Primary theme: ([^.]+)\./i, "Users repeatedly report $1 as a recurring theme.")
      .trim();
    return cleaned || insight.inferredBehaviour || insight.rootCause || null;
  }

  if (finding === title || firstSentence(finding) === title) {
    const rest = finding.slice(firstSentence(finding).length).trim().replace(/^[,.]\s*/, "");
    return rest || null;
  }

  return finding;
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

type Props = {
  insight: DiscoveryInsight;
  totalReviews?: number;
};

export function InsightTile({ insight, totalReviews }: Props) {
  const [open, setOpen] = useState(false);
  const title = insightCardTitle(insight);
  const coverage = datasetCoverageLine(insight, totalReviews);
  const insightBody = insightSectionBody(insight, title);
  const soWhat = stripSoWhatPrefix(insight.worthSolvingRationale);
  const hasEvidence =
    insight.representativeQuotes.length > 0 || insight.evidenceSummary.length > 0 || insight.confidenceRationale;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card overflow-hidden transition-colors",
        "hover:bg-muted/20",
        open && "bg-muted/15 ring-1 ring-border",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 flex gap-3 items-start group"
        aria-expanded={open}
      >
        <div
          className={cn(
            "shrink-0 size-12 rounded-md flex items-center justify-center text-xs font-bold",
            "bg-gradient-to-br from-primary/30 to-primary/5 text-primary border border-primary/20",
          )}
        >
          {insight.questionId.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{insight.question}</p>
          <p className="text-base font-semibold text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
            {title}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-border/80">
              {insight.evidenceCount} mentions
            </Badge>
            {insight.businessImpact && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {insight.businessImpact} impact
              </Badge>
            )}
            {insight.worthSolving != null && (
              <Badge
                variant={insight.worthSolving ? "default" : "secondary"}
                className="text-[10px] h-5 px-1.5"
              >
                {insight.worthSolving ? "Worth solving" : "Lower priority"}
              </Badge>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground mt-1 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/50 mx-4 mb-4 mt-0">
          {(coverage || insightBody) && (
            <DetailBlock label="Insight">
              {coverage && <p className="text-muted-foreground text-xs mb-2">{coverage}</p>}
              {insightBody}
            </DetailBlock>
          )}
          {insight.inferredBehaviour && (
            <DetailBlock label="Inferred behaviour">{insight.inferredBehaviour}</DetailBlock>
          )}
          {insight.rootCause && <DetailBlock label="AI interpretation">{insight.rootCause}</DetailBlock>}
          {insight.businessImpactDescription && (
            <DetailBlock label="Business impact">{insight.businessImpactDescription}</DetailBlock>
          )}
          {insight.aiOpportunity && (
            <DetailBlock label="Potential AI opportunity">{insight.aiOpportunity}</DetailBlock>
          )}
          {insight.affectedSegments && insight.affectedSegments.length > 0 && (
            <DetailBlock label="Affected segments">
              <div className="flex flex-wrap gap-1.5">
                {insight.affectedSegments.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </DetailBlock>
          )}
          {soWhat && <DetailBlock label="So what?">{soWhat}</DetailBlock>}

          {hasEvidence && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Supporting evidence
              </p>
              {insight.evidenceSummary.length > 0 && (
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                  {insight.evidenceSummary.slice(0, 4).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {insight.representativeQuotes.length > 0 && (
                <div className="space-y-2">
                  {insight.representativeQuotes.slice(0, 3).map((q, i) => (
                    <QuoteCitation key={`${q.url ?? q.quote}-${i}`} quote={q} compact />
                  ))}
                </div>
              )}
              {insight.confidenceRationale && (
                <p className="text-xs text-muted-foreground/80">{insight.confidenceRationale}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
