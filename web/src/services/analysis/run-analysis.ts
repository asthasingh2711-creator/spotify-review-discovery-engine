import {
  PM_AGENT_SYSTEM_PROMPT,
  DISCOVERY_CHUNK_PROMPT,
  buildDiscoverySynthesisPrompt,
} from "@/prompts/discovery";
import { getCerebrasClient, getCerebrasModel } from "@/services/cerebras/client";
import { aggregateBatches } from "@/services/analysis/aggregate";
import { BatchReportSchema, type BatchReport } from "@/services/analysis/batch-schema";
import { reviewsToText } from "@/services/analysis/chunk";
import { callChatWithRetry, safeJsonParse, LlmQuotaError } from "@/services/analysis/llm";
import { buildProgrammaticStats } from "@/services/analysis/programmatic-stats";
import { EXTRACTION_RESPONSE_FORMAT } from "@/services/analysis/extraction-schema";
import { normalizeBatchReport } from "@/services/analysis/normalize-batch";
import { runOfflineAnalysis } from "@/services/analysis/offline-analysis";
import { SYNTHESIS_RESPONSE_FORMAT } from "@/services/analysis/synthesis-schema";
import { finalizeLlmReport } from "@/services/analysis/finalize-llm-report";
import { saveAggregatedOutput, createRunId } from "@/services/analysis/intermediate";
import { stratifiedSample } from "@/services/analysis/sample-reviews";
import type { AnalyzeResponse, PMReport } from "@/types/analysis";
import type { NormalizedReview } from "@/types/reviews";

export type AnalysisProgressEvent =
  | { type: "status"; message: string }
  | { type: "chunk"; current: number; total: number; message: string }
  | { type: "done"; data: AnalyzeResponse; runId: string }
  | { type: "error"; message: string };

const SAMPLE_SIZE = 80;
const BODY_CHARS = 320;

type PartialBatch = Omit<PMReport, "overview">;

function normalizeReport(data: PMReport): PMReport {
  const insights = (data.discoveryInsights ?? []).map((insight) => ({
    ...insight,
    finding: insight.finding ?? insight.answer ?? "",
  }));
  return { ...data, discoveryInsights: insights };
}

function buildSynthesisInput(
  aggregated: PartialBatch,
  overview: PMReport["overview"],
  programmatic: ReturnType<typeof buildProgrammaticStats>,
) {
  return {
    overview,
    fullDatasetStats: programmatic,
    sentiment: aggregated.sentiment,
    themes: aggregated.themes.slice(0, 8),
    jtbds: aggregated.jtbds.slice(0, 6),
    painPoints: aggregated.painPoints.slice(0, 8),
    rootCauses: aggregated.rootCauses.slice(0, 6),
    segments: aggregated.segments.slice(0, 5),
    opportunities: aggregated.opportunities.slice(0, 8),
    listeningBehaviours: aggregated.listeningBehaviours?.slice(0, 6) ?? [],
    summaryDraft: aggregated.summary,
  };
}

function parseBatchReport(
  text: string,
  opts: { sentimentFallback?: { positive: number; neutral: number; negative: number } } = {},
) {
  const extractionJson = safeJsonParse(text);
  if (!extractionJson) return null;

  const normalized = normalizeBatchReport(extractionJson, opts);
  if (!normalized) return null;

  return BatchReportSchema.safeParse(normalized);
}

function mergeSynthesisWithExtraction(
  overview: PMReport["overview"],
  aggregated: PartialBatch,
  synthesis: BatchReport,
): PMReport {
  return normalizeReport({
    overview,
    ...aggregated,
    sentiment: synthesis.sentiment ?? aggregated.sentiment,
    discoveryInsights: synthesis.discoveryInsights ?? aggregated.discoveryInsights,
    executiveSummary: synthesis.executiveSummary ?? aggregated.executiveSummary,
    pmRecommendations: synthesis.pmRecommendations ?? aggregated.pmRecommendations,
    summary: synthesis.summary ?? aggregated.summary,
    themes: aggregated.themes,
    jtbds: aggregated.jtbds,
    painPoints: aggregated.painPoints,
    rootCauses: aggregated.rootCauses,
    segments: aggregated.segments,
    opportunities: aggregated.opportunities,
    listeningBehaviours: aggregated.listeningBehaviours,
    personas: synthesis.personas ?? aggregated.personas,
    advancedAnalysis: synthesis.advancedAnalysis ?? aggregated.advancedAnalysis,
  } as PMReport);
}

export async function runAnalysis(
  reviews: NormalizedReview[],
  opts: {
    onProgress?: (e: AnalysisProgressEvent) => void;
    offline?: boolean;
  } = {},
): Promise<AnalyzeResponse & { runId: string }> {
  const onProgress = opts.onProgress;
  const scope = "discovery" as const;
  const runId = createRunId();
  const totalLoaded = reviews.length;
  const forceOffline =
    opts.offline === true ||
    process.env.ANALYSIS_OFFLINE === "1" ||
    process.env.ANALYSIS_OFFLINE === "true";

  onProgress?.({ type: "status", message: "Preparing discovery-relevant reviews..." });

  const cleaned = reviews
    .map((r) => ({ ...r, title: (r.title || "").trim(), body: (r.body || "").trim() }))
    .filter((r) => r.title.length > 0 || r.body.length > 0);

  if (cleaned.length === 0) {
    throw new Error("No discovery-relevant reviews available. Refresh the dataset or run ETL.");
  }

  if (forceOffline) {
    const { report, warnings } = runOfflineAnalysis(cleaned, {
      totalLoaded,
      onProgress: (message) => onProgress?.({ type: "status", message }),
    });
    const out: AnalyzeResponse = { report, warnings, scope };
    onProgress?.({ type: "done", data: out, runId });
    return { ...out, runId };
  }

  try {
    return await runLlmAnalysis(cleaned, {
      onProgress,
      runId,
      scope,
      totalLoaded,
    });
  } catch (err) {
    if (err instanceof LlmQuotaError) {
      onProgress?.({
        type: "status",
        message: "Cerebras quota reached — switching to offline analysis...",
      });
      const { report, warnings } = runOfflineAnalysis(cleaned, {
        totalLoaded,
        onProgress: (message) => onProgress?.({ type: "status", message }),
      });
      const out: AnalyzeResponse = { report, warnings, scope };
      onProgress?.({ type: "done", data: out, runId });
      return { ...out, runId };
    }
    throw err;
  }
}

async function runLlmAnalysis(
  cleaned: NormalizedReview[],
  ctx: {
    onProgress?: (e: AnalysisProgressEvent) => void;
    runId: string;
    scope: "discovery";
    totalLoaded: number;
  },
): Promise<AnalyzeResponse & { runId: string }> {
  const { onProgress, runId, scope, totalLoaded } = ctx;
  const warnings: string[] = [];
  const model = getCerebrasModel();
  const client = getCerebrasClient();

  const programmatic = buildProgrammaticStats(cleaned);
  const sentimentFallback = {
    positive: programmatic.ratingSentiment.positivePct,
    neutral: programmatic.ratingSentiment.neutralPct,
    negative: programmatic.ratingSentiment.negativePct,
  };
  const sample = stratifiedSample(cleaned, SAMPLE_SIZE);

  onProgress?.({
    type: "status",
    message: `Exactly 2 API calls: sample ${sample.length}/${cleaned.length} reviews → extract + synthesize. Quotes hydrated from full corpus.`,
  });

  onProgress?.({ type: "status", message: `Call 1/2 — extracting patterns...` });
  onProgress?.({ type: "chunk", current: 1, total: 2, message: "Extracting patterns from representative reviews..." });

  const sampleText = sample.map((r) => reviewsToText(r, BODY_CHARS)).join("\n---\n");

  const extractionText = await callChatWithRetry(
    client,
    model,
    [
      { role: "system", content: PM_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${DISCOVERY_CHUNK_PROMPT}\n\nRepresentative sample (${sample.length} of ${cleaned.length} reviews):\n${sampleText}`,
      },
    ],
    {
      maxCompletionTokens: 4096,
      temperature: 0.15,
      reasoningEffort: "low",
      responseFormat: EXTRACTION_RESPONSE_FORMAT,
    },
  );

  const extractionParsed = parseBatchReport(extractionText, { sentimentFallback });

  if (!extractionParsed?.success) {
    const detail = extractionParsed?.error?.issues?.[0]?.message ?? "invalid JSON schema";
    warnings.push(
      `Call 1 extraction returned invalid JSON (${detail}). Falling back to offline analysis with full quoted evidence.`,
    );
    const { report, warnings: offlineWarnings } = runOfflineAnalysis(cleaned, {
      totalLoaded,
      onProgress: (message) => onProgress?.({ type: "status", message }),
    });
    const out: AnalyzeResponse = { report, warnings: [...warnings, ...offlineWarnings], scope };
    onProgress?.({ type: "done", data: out, runId });
    return { ...out, runId };
  }

  const sources: Record<string, number> = {};
  for (const r of cleaned) sources[r.source] = (sources[r.source] ?? 0) + 1;

  const overview: PMReport["overview"] = {
    totalReviewsAnalyzed: cleaned.length,
    sources,
    scope,
    totalLoaded,
  };

  const aggregated = aggregateBatches([extractionParsed.data as PartialBatch], overview);
  await saveAggregatedOutput(runId, { ...aggregated, scope });

  onProgress?.({ type: "status", message: "Call 2/2 — synthesizing PM intelligence..." });
  onProgress?.({ type: "chunk", current: 2, total: 2, message: "Synthesizing PM intelligence..." });

  const synthesisInput = buildSynthesisInput(aggregated, overview, programmatic);
  const synthesisText = await callChatWithRetry(
    client,
    model,
    [
      { role: "system", content: PM_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${buildDiscoverySynthesisPrompt()}\n\nData (programmatic stats + call-1 extraction):\n${JSON.stringify(synthesisInput)}`,
      },
    ],
    {
      maxCompletionTokens: 8192,
      temperature: 0.2,
      reasoningEffort: "low",
      responseFormat: SYNTHESIS_RESPONSE_FORMAT,
    },
  );

  const synthesisParsed = parseBatchReport(synthesisText, { sentimentFallback });
  const synthesisOk = synthesisParsed?.success === true;

  let baseReport: PMReport;
  if (synthesisOk) {
    baseReport = mergeSynthesisWithExtraction(overview, aggregated, synthesisParsed.data);
  } else {
    baseReport = { ...aggregated, overview } as PMReport;
    const detail = synthesisParsed?.error?.issues?.[0]?.message ?? "schema validation failed";
    warnings.push(
      `PM synthesis call returned invalid JSON (${detail}). Using call-1 extraction + offline PM modules with full quoted evidence.`,
    );
  }

  const report = finalizeLlmReport(baseReport, cleaned, { synthesisOk });

  const out: AnalyzeResponse = { report, warnings, scope };
  onProgress?.({ type: "done", data: out, runId });
  return { ...out, runId };
}
