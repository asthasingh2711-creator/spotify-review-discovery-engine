import { evidenceQuotesFromReviews } from "@/lib/evidence-quote";
import { DISCOVERY_MODULES } from "@/constants/discovery-questions";
import { buildOfflineReport } from "@/services/analysis/offline-analysis";
import { hydrateEvidenceQuotes, hydrateReportQuotes } from "@/services/analysis/hydrate-quotes";
import { matchReviews } from "@/services/analysis/pm-intelligence-narratives";
import type { DiscoveryInsight, PMReport } from "@/types/analysis";
import type { NormalizedReview } from "@/types/reviews";

const QUESTION_TERMS: Record<string, string[]> = {
  d1: ["discover", "new music", "explore", "find"],
  d2: ["barrier", "hard to", "struggle", "can't find"],
  d3: ["same", "repeat", "repetitive", "again"],
  d4: ["recommend", "suggestion", "algorithm", "wrong"],
  d5: ["discover weekly", "release radar", "mix", "dj"],
  d6: ["wish", "need", "want", "unmet"],
};

function termsForQuestion(questionId: string, question: string): string[] {
  return QUESTION_TERMS[questionId] ?? question.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
}

function quotesForQuestion(reviews: NormalizedReview[], questionId: string, question: string) {
  const matched = matchReviews(reviews, termsForQuestion(questionId, question));
  return evidenceQuotesFromReviews(matched, 2);
}

function mergeInsightQuotes(
  llm: DiscoveryInsight,
  offline: DiscoveryInsight | undefined,
  reviews: NormalizedReview[],
) {
  const hydratedLlm = hydrateEvidenceQuotes(llm.representativeQuotes ?? [], reviews);
  const withUrls = hydratedLlm.filter((q) => q.url);
  if (withUrls.length >= 2) return hydratedLlm.slice(0, 3);
  const fromOffline = offline?.representativeQuotes ?? [];
  if (fromOffline.length >= 2) return fromOffline;
  const fromCorpus = quotesForQuestion(reviews, llm.questionId, llm.question);
  if (fromCorpus.length >= 2) return fromCorpus;
  return [...hydratedLlm, ...fromOffline, ...fromCorpus].slice(0, 3);
}

/**
 * Keep LLM-generated insight text; ensure quotes match offline quality (verbatim + url + source).
 * Fill missing PM modules from offline when synthesis is thin.
 */
export function finalizeLlmReport(
  report: PMReport,
  reviews: NormalizedReview[],
  opts: { synthesisOk: boolean },
): PMReport {
  const offline = buildOfflineReport(reviews, report.overview);
  const offlineById = new Map((offline.discoveryInsights ?? []).map((i) => [i.questionId, i]));

  let merged: PMReport = {
    ...report,
    discoveryInsights: (
      report.discoveryInsights?.length ? report.discoveryInsights : offline.discoveryInsights ?? []
    ).map((insight) => {
      const off = offlineById.get(insight.questionId);
      return {
        ...(off ?? {}),
        ...insight,
        finding: insight.finding || off?.finding || "",
        gist: insight.gist || off?.gist,
        representativeQuotes: mergeInsightQuotes(insight, off, reviews),
      };
    }),
    executiveSummary: report.executiveSummary?.recommendedPMFocus
      ? report.executiveSummary
      : offline.executiveSummary,
    personas: (report.personas?.length ?? 0) > 0 ? report.personas : offline.personas,
    pmRecommendations:
      (report.pmRecommendations?.length ?? 0) > 0 ? report.pmRecommendations : offline.pmRecommendations,
    advancedAnalysis: report.advancedAnalysis ?? offline.advancedAnalysis,
  };

  if (!opts.synthesisOk) {
    merged = {
      ...merged,
      themes: merged.themes.length ? merged.themes : offline.themes,
      opportunities: merged.opportunities.length ? merged.opportunities : offline.opportunities,
    };
  }

  if ((merged.discoveryInsights?.length ?? 0) < 10) {
    const byId = new Map((merged.discoveryInsights ?? []).map((i) => [i.questionId, i]));
    for (const mod of DISCOVERY_MODULES) {
      for (const q of mod.questions) {
        if (!byId.has(q.id)) {
          const off = offlineById.get(q.id);
          if (off) byId.set(q.id, off);
        }
      }
    }
    merged.discoveryInsights = [...byId.values()];
  }

  return hydrateReportQuotes(merged, reviews);
}
