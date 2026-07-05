import { z } from "zod";

const QuoteSchema = z.object({
  quote: z.string(),
  source: z.string().optional(),
  date: z.string().optional(),
  url: z.string().optional(),
  author: z.string().optional(),
});

const QuoteOrStringSchema = z.union([z.string(), QuoteSchema]);

export const BatchReportSchema = z.object({
  sentiment: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
  }),
  themes: z
    .array(
      z.object({
        theme: z.string(),
        description: z.string(),
        frequency: z.number(),
        representativeQuotes: z.array(QuoteSchema),
      }),
    )
    .default([]),
  jtbds: z
    .array(
      z.object({
        job: z.string(),
        frequency: z.number(),
        examples: z.array(QuoteOrStringSchema).default([]),
      }),
    )
    .default([]),
  painPoints: z
    .array(
      z.object({
        painPoint: z.string(),
        frequency: z.number(),
        representativeQuotes: z.array(QuoteOrStringSchema).default([]),
      }),
    )
    .default([]),
  rootCauses: z
    .array(
      z.object({
        complaint: z.string(),
        inferredRootCause: z.string(),
        evidenceQuotes: z.array(QuoteOrStringSchema).default([]),
        confidence: z.number(),
      }),
    )
    .default([]),
  segments: z
    .array(
      z.object({
        segment: z.string(),
        description: z.string(),
        estimatedShare: z.number(),
        keyThemes: z.array(z.string()).default([]),
        representativeQuotes: z.array(QuoteOrStringSchema).default([]),
      }),
    )
    .default([]),
  opportunities: z
    .array(
      z.object({
        opportunity: z.string(),
        evidence: z.array(QuoteOrStringSchema).default([]),
        affectedSegments: z.array(z.string()).default([]),
        businessImpact: z.enum(["low", "medium", "high"]),
        confidence: z.number(),
        priority: z.enum(["p0", "p1", "p2"]),
      }),
    )
    .default([]),
  listeningBehaviours: z
    .array(
      z.object({
        behaviour: z.string(),
        frequency: z.number(),
        contexts: z.array(z.string()).default([]),
        examples: z.array(QuoteOrStringSchema).default([]),
      }),
    )
    .default([])
    .optional(),
  personas: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        goals: z.array(z.string()).default([]),
        painPoints: z.array(z.string()).default([]),
        discoveryBarriers: z.array(z.string()).default([]),
        opportunities: z.array(z.string()).default([]),
        estimatedShare: z.number(),
      }),
    )
    .default([])
    .optional(),
  discoveryInsights: z
    .array(
      z.object({
        questionId: z.string(),
        question: z.string(),
        gist: z.string().optional(),
        finding: z.string().optional(),
        answer: z.string().optional(),
        frequency: z.number().optional(),
        confidence: z.number(),
        evidenceCount: z.number(),
        evidenceSummary: z.array(z.string()).default([]),
        representativeQuotes: z.array(QuoteOrStringSchema).default([]),
        inferredBehaviour: z.string().optional(),
        rootCause: z.string().optional(),
        affectedSegments: z.array(z.string()).default([]).optional(),
        businessImpact: z.enum(["low", "medium", "high"]).optional(),
        businessImpactDescription: z.string().optional(),
        aiOpportunity: z.string().optional(),
        confidenceRationale: z.string().optional(),
        worthSolving: z.boolean().optional(),
        worthSolvingRationale: z.string().optional(),
      }),
    )
    .default([])
    .optional(),
  pmRecommendations: z
    .array(
      z.object({
        title: z.string(),
        impact: z.enum(["low", "medium", "high"]),
        confidence: z.number(),
        rationale: z.string(),
        priority: z.enum(["p0", "p1", "p2"]),
      }),
    )
    .default([])
    .optional(),
  executiveSummary: z
    .object({
      topFrustrations: z.array(z.string()).default([]),
      topUnmetNeeds: z.array(z.string()).default([]),
      topDiscoveryBarriers: z.array(z.string()).default([]),
      topOpportunities: z.array(z.string()).default([]),
      emergingSegments: z.array(z.string()).default([]),
      recommendedProblemStatement: z.string().default(""),
      candidateProblemStatements: z
        .array(z.object({ id: z.string(), label: z.string(), statement: z.string() }))
        .optional(),
      recommendedProblemId: z.string().optional(),
      solutionDirections: z.array(z.string()).default([]),
      prioritizedRecommendation: z.string().default(""),
      rationale: z.string().default(""),
      suggestedInterviewQuestions: z.array(z.string()).default([]),
      interviewGuideByHypothesis: z
        .array(z.object({ hypothesis: z.string(), questions: z.array(z.string()) }))
        .optional(),
      nextSteps: z.array(z.string()).optional(),
      topDiscoveryProblems: z.array(z.string()).default([]),
      topRecommendationFrustrations: z.array(z.string()).default([]),
      topProductOpportunities: z.array(z.string()).default([]),
      emergingUserSegments: z.array(z.string()).default([]),
      researchHypotheses: z.array(z.string()).default([]),
      recommendedPMFocus: z.string().default(""),
    })
    .optional(),
  advancedAnalysis: z
    .object({
      competitive: z
        .object({
          competitors: z.array(z.string()).default([]),
          requestedFeatures: z.array(z.string()).default([]),
          comparisonReasons: z.array(z.string()).default([]),
        })
        .optional(),
      sentiment: z
        .object({
          positiveThemes: z.array(z.string()).default([]),
          negativeThemes: z.array(z.string()).default([]),
          polarizingTopics: z.array(z.string()).default([]),
        })
        .optional(),
      featureRequests: z
        .object({
          topRequests: z.array(z.string()).default([]),
          crossPlatformRequests: z.array(z.string()).default([]),
        })
        .optional(),
    })
    .optional(),
  summary: z.object({
    topProblems: z.array(z.string()).default([]),
    topOpportunities: z.array(z.string()).default([]),
    biggestRisks: z.array(z.string()).default([]),
    keyInsights: z.array(z.string()).default([]),
  }),
});

export type BatchReport = z.infer<typeof BatchReportSchema>;
