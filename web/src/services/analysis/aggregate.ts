import type { PMReport, ThemeCluster, Opportunity, RootCause, UserSegment, JTBDGroup, PainPoint, ListeningBehaviour } from "@/types/analysis";
import type { SentimentLabel } from "@/types/reviews";

type PartialBatch = Omit<PMReport, "overview"> & { overview?: never };

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function mergeSentiment(into: Record<SentimentLabel, number>, batch: Record<SentimentLabel, number>) {
  into.positive += batch.positive ?? 0;
  into.neutral += batch.neutral ?? 0;
  into.negative += batch.negative ?? 0;
}

function toPercentages(sum: Record<SentimentLabel, number>): Record<SentimentLabel, number> {
  const total = (sum.positive ?? 0) + (sum.neutral ?? 0) + (sum.negative ?? 0);
  if (total <= 0) return { positive: 0, neutral: 0, negative: 0 };
  return {
    positive: Math.round(((sum.positive ?? 0) / total) * 100),
    neutral: Math.round(((sum.neutral ?? 0) / total) * 100),
    negative: Math.round(((sum.negative ?? 0) / total) * 100),
  };
}

function mergeTopNByFrequency<T extends { frequency: number }>(
  items: T[],
  keyFn: (x: T) => string,
  mergeFn: (a: T, b: T) => T,
  limit = 25,
): T[] {
  const map = new Map<string, T>();
  for (const it of items) {
    const k = keyFn(it);
    const prev = map.get(k);
    map.set(k, prev ? mergeFn(prev, it) : it);
  }
  return [...map.values()].sort((a, b) => b.frequency - a.frequency).slice(0, limit);
}

export function aggregateBatches(
  batches: PartialBatch[],
  overview: PMReport["overview"],
): PMReport {
  const sentimentSum: Record<SentimentLabel, number> = { positive: 0, neutral: 0, negative: 0 };
  const themesAll: ThemeCluster[] = [];
  const jtbdsAll: JTBDGroup[] = [];
  const painAll: PainPoint[] = [];
  const rootAll: RootCause[] = [];
  const segmentsAll: UserSegment[] = [];
  const oppsAll: Opportunity[] = [];
  const listeningAll: ListeningBehaviour[] = [];
  const topProblems: string[] = [];
  const topOpportunities: string[] = [];
  const biggestRisks: string[] = [];
  const keyInsights: string[] = [];

  for (const b of batches) {
    if (b.sentiment) mergeSentiment(sentimentSum, b.sentiment);
    if (b.themes) themesAll.push(...b.themes);
    if (b.jtbds) jtbdsAll.push(...b.jtbds);
    if (b.painPoints) painAll.push(...b.painPoints);
    if (b.rootCauses) rootAll.push(...b.rootCauses);
    if (b.segments) segmentsAll.push(...b.segments);
    if (b.opportunities) oppsAll.push(...b.opportunities);
    if ((b as any).listeningBehaviours) listeningAll.push(...((b as any).listeningBehaviours as ListeningBehaviour[]));
    if (b.summary?.topProblems) topProblems.push(...b.summary.topProblems);
    if (b.summary?.topOpportunities) topOpportunities.push(...b.summary.topOpportunities);
    if (b.summary?.biggestRisks) biggestRisks.push(...b.summary.biggestRisks);
    if (b.summary?.keyInsights) keyInsights.push(...b.summary.keyInsights);
  }

  const themes = mergeTopNByFrequency(
    themesAll,
    (t) => t.theme.toLowerCase(),
    (a, b) => ({
      ...a,
      frequency: (a.frequency ?? 0) + (b.frequency ?? 0),
      representativeQuotes: [...(a.representativeQuotes ?? []), ...(b.representativeQuotes ?? [])].slice(0, 12),
      description: a.description || b.description,
    }),
    30,
  );

  const jtbds = mergeTopNByFrequency(
    jtbdsAll,
    (j) => j.job.toLowerCase(),
    (a, b) => ({
      ...a,
      frequency: (a.frequency ?? 0) + (b.frequency ?? 0),
      examples: [...(a.examples ?? []), ...(b.examples ?? [])].slice(0, 10),
    }),
    25,
  );

  const painPoints = mergeTopNByFrequency(
    painAll,
    (p) => p.painPoint.toLowerCase(),
    (a, b) => ({
      ...a,
      frequency: (a.frequency ?? 0) + (b.frequency ?? 0),
      representativeQuotes: [...(a.representativeQuotes ?? []), ...(b.representativeQuotes ?? [])].slice(0, 12),
    }),
    25,
  );

  const rootCauses = mergeTopNByFrequency(
    rootAll.map((r) => ({ ...r, confidence: clamp01(r.confidence ?? 0.5), frequency: 1 })),
    (r) => r.complaint.toLowerCase(),
    (a, b) => ({
      ...a,
      confidence: clamp01((a.confidence + b.confidence) / 2),
      evidenceQuotes: [...(a.evidenceQuotes ?? []), ...(b.evidenceQuotes ?? [])].slice(0, 10),
      inferredRootCause: a.inferredRootCause || b.inferredRootCause,
      frequency: (a.frequency ?? 0) + (b.frequency ?? 0),
    }),
    25,
  ).map(({ frequency: _f, ...rest }) => rest) as RootCause[];

  const segments = mergeTopNByFrequency(
    segmentsAll
      .map((s) => ({ ...s, estimatedShare: clamp01(s.estimatedShare ?? 0) }))
      .map((s) => ({ ...s, frequency: Math.round((s.estimatedShare ?? 0) * 100) })),
    (s) => s.segment.toLowerCase(),
    (a, b) => ({
      ...a,
      estimatedShare: clamp01((a.estimatedShare + b.estimatedShare) / 2),
      keyThemes: [...new Set([...(a.keyThemes ?? []), ...(b.keyThemes ?? [])])].slice(0, 10),
      representativeQuotes: [...(a.representativeQuotes ?? []), ...(b.representativeQuotes ?? [])].slice(0, 10),
      description: a.description || b.description,
      frequency: (a.frequency ?? 0) + (b.frequency ?? 0),
    }),
    12,
  ).map(({ frequency: _f, ...rest }) => rest) as UserSegment[];

  const opportunities = mergeTopNByFrequency(
    oppsAll.map((o) => ({ ...o, confidence: clamp01(o.confidence ?? 0.5), frequency: 1 })),
    (o) => o.opportunity.toLowerCase(),
    (a, b) => ({
      ...a,
      confidence: clamp01((a.confidence + b.confidence) / 2),
      evidence: [...(a.evidence ?? []), ...(b.evidence ?? [])].slice(0, 12),
      affectedSegments: [...new Set([...(a.affectedSegments ?? []), ...(b.affectedSegments ?? [])])].slice(0, 10),
      businessImpact: a.businessImpact ?? b.businessImpact,
      priority: a.priority ?? b.priority,
      frequency: (a.frequency ?? 0) + (b.frequency ?? 0),
    }),
    25,
  ).map(({ frequency: _f, ...rest }) => rest) as Opportunity[];

  const listeningBehaviours = mergeTopNByFrequency(
    listeningAll,
    (b) => b.behaviour.toLowerCase(),
    (a, b) => ({
      ...a,
      frequency: (a.frequency ?? 0) + (b.frequency ?? 0),
      contexts: [...new Set([...(a.contexts ?? []), ...(b.contexts ?? [])])].slice(0, 8),
      examples: [...(a.examples ?? []), ...(b.examples ?? [])].slice(0, 8),
    }),
    20,
  );

  return {
    overview,
    sentiment: toPercentages(sentimentSum),
    themes,
    jtbds,
    painPoints,
    rootCauses,
    segments,
    opportunities,
    listeningBehaviours,
    summary: {
      topProblems: [...new Set(topProblems)].slice(0, 10),
      topOpportunities: [...new Set(topOpportunities)].slice(0, 10),
      biggestRisks: [...new Set(biggestRisks)].slice(0, 10),
      keyInsights: [...new Set(keyInsights)].slice(0, 12),
    },
  };
}

