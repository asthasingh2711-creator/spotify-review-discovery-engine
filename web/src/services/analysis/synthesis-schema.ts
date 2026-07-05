import { QUOTE_OBJECT_ARRAY } from "@/services/analysis/quote-schema";

/**
 * Call 2 outputs PM intelligence only — extraction (call 1) already provides themes/JTBD/etc.
 * Smaller schema = fewer failures on limited API quota.
 */
export const SYNTHESIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    sentiment: {
      type: "object",
      properties: {
        positive: { type: "number" },
        neutral: { type: "number" },
        negative: { type: "number" },
      },
      required: ["positive", "neutral", "negative"],
      additionalProperties: false,
    },
    discoveryInsights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "string" },
          question: { type: "string" },
          finding: { type: "string" },
          gist: { type: "string" },
          evidenceCount: { type: "number" },
          confidence: { type: "number" },
          representativeQuotes: QUOTE_OBJECT_ARRAY,
          evidenceSummary: { type: "array", items: { type: "string" } },
          inferredBehaviour: { type: "string" },
          rootCause: { type: "string" },
          affectedSegments: { type: "array", items: { type: "string" } },
          businessImpact: { type: "string", enum: ["low", "medium", "high"] },
          businessImpactDescription: { type: "string" },
          worthSolving: { type: "boolean" },
          worthSolvingRationale: { type: "string" },
          aiOpportunity: { type: "string" },
          confidenceRationale: { type: "string" },
        },
        required: [
          "questionId",
          "question",
          "finding",
          "evidenceCount",
          "confidence",
          "representativeQuotes",
          "evidenceSummary",
          "inferredBehaviour",
          "rootCause",
          "businessImpact",
          "worthSolving",
          "worthSolvingRationale",
          "aiOpportunity",
        ],
        additionalProperties: false,
      },
    },
    executiveSummary: {
      type: "object",
      properties: {
        topDiscoveryProblems: { type: "array", items: { type: "string" } },
        topRecommendationFrustrations: { type: "array", items: { type: "string" } },
        topUnmetNeeds: { type: "array", items: { type: "string" } },
        topProductOpportunities: { type: "array", items: { type: "string" } },
        emergingUserSegments: { type: "array", items: { type: "string" } },
        researchHypotheses: { type: "array", items: { type: "string" } },
        recommendedProblemStatement: { type: "string" },
        solutionDirections: { type: "array", items: { type: "string" } },
        suggestedInterviewQuestions: { type: "array", items: { type: "string" } },
        recommendedPMFocus: { type: "string" },
        prioritizedRecommendation: { type: "string" },
        rationale: { type: "string" },
      },
      required: [
        "topDiscoveryProblems",
        "topRecommendationFrustrations",
        "topUnmetNeeds",
        "topProductOpportunities",
        "emergingUserSegments",
        "researchHypotheses",
        "recommendedProblemStatement",
        "solutionDirections",
        "suggestedInterviewQuestions",
        "recommendedPMFocus",
        "prioritizedRecommendation",
        "rationale",
      ],
      additionalProperties: false,
    },
    pmRecommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          impact: { type: "string", enum: ["low", "medium", "high"] },
          confidence: { type: "number" },
          rationale: { type: "string" },
          priority: { type: "string", enum: ["p0", "p1", "p2"] },
        },
        required: ["title", "impact", "confidence", "rationale", "priority"],
        additionalProperties: false,
      },
    },
    summary: {
      type: "object",
      properties: {
        topProblems: { type: "array", items: { type: "string" } },
        topOpportunities: { type: "array", items: { type: "string" } },
        biggestRisks: { type: "array", items: { type: "string" } },
        keyInsights: { type: "array", items: { type: "string" } },
      },
      required: ["topProblems", "topOpportunities", "biggestRisks", "keyInsights"],
      additionalProperties: false,
    },
  },
  required: ["sentiment", "discoveryInsights", "executiveSummary", "pmRecommendations", "summary"],
  additionalProperties: false,
} as const;

export const SYNTHESIS_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "discovery_synthesis",
    strict: true,
    schema: SYNTHESIS_JSON_SCHEMA,
  },
};
