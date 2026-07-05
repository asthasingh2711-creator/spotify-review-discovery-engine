import { QUOTE_OBJECT_ARRAY } from "@/services/analysis/quote-schema";

/** Cerebras strict JSON schema for the extraction (call 1) response. */
export const EXTRACTION_JSON_SCHEMA = {
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
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          theme: { type: "string" },
          description: { type: "string" },
          frequency: { type: "number" },
          representativeQuotes: QUOTE_OBJECT_ARRAY,
        },
        required: ["theme", "description", "frequency", "representativeQuotes"],
        additionalProperties: false,
      },
    },
    jtbds: {
      type: "array",
      items: {
        type: "object",
        properties: {
          job: { type: "string" },
          frequency: { type: "number" },
          examples: QUOTE_OBJECT_ARRAY,
        },
        required: ["job", "frequency", "examples"],
        additionalProperties: false,
      },
    },
    painPoints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          painPoint: { type: "string" },
          frequency: { type: "number" },
          representativeQuotes: QUOTE_OBJECT_ARRAY,
        },
        required: ["painPoint", "frequency", "representativeQuotes"],
        additionalProperties: false,
      },
    },
    rootCauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          complaint: { type: "string" },
          inferredRootCause: { type: "string" },
          evidenceQuotes: QUOTE_OBJECT_ARRAY,
          confidence: { type: "number" },
        },
        required: ["complaint", "inferredRootCause", "evidenceQuotes", "confidence"],
        additionalProperties: false,
      },
    },
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          segment: { type: "string" },
          description: { type: "string" },
          estimatedShare: { type: "number" },
          keyThemes: { type: "array", items: { type: "string" } },
          representativeQuotes: QUOTE_OBJECT_ARRAY,
        },
        required: ["segment", "description", "estimatedShare", "keyThemes", "representativeQuotes"],
        additionalProperties: false,
      },
    },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          opportunity: { type: "string" },
          evidence: QUOTE_OBJECT_ARRAY,
          affectedSegments: { type: "array", items: { type: "string" } },
          businessImpact: { type: "string", enum: ["low", "medium", "high"] },
          confidence: { type: "number" },
          priority: { type: "string", enum: ["p0", "p1", "p2"] },
        },
        required: [
          "opportunity",
          "evidence",
          "affectedSegments",
          "businessImpact",
          "confidence",
          "priority",
        ],
        additionalProperties: false,
      },
    },
    listeningBehaviours: {
      type: "array",
      items: {
        type: "object",
        properties: {
          behaviour: { type: "string" },
          frequency: { type: "number" },
          contexts: { type: "array", items: { type: "string" } },
          examples: QUOTE_OBJECT_ARRAY,
        },
        required: ["behaviour", "frequency", "contexts", "examples"],
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
  required: [
    "sentiment",
    "themes",
    "jtbds",
    "painPoints",
    "rootCauses",
    "segments",
    "opportunities",
    "listeningBehaviours",
    "summary",
  ],
  additionalProperties: false,
} as const;

export const EXTRACTION_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "discovery_extraction",
    strict: true,
    schema: EXTRACTION_JSON_SCHEMA,
  },
};
