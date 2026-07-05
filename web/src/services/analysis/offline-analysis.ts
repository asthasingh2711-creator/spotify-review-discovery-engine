import { DISCOVERY_MODULES } from "@/constants/discovery-questions";
import { evidenceQuotesFromReviews, textGist } from "@/lib/evidence-quote";
import { computeRatingSentimentSplit } from "@/lib/sentiment-from-rating";
import {
  assignPersonas,
  buildInsightFinding,
  businessImpactDescription,
  CANDIDATE_PROBLEMS,
  evidenceConfidence,
  INTERVIEW_GUIDE,
  matchReviews,
  NEXT_STEPS,
  PERSONA_DEFS,
  rankGrowthPatterns,
  RECOMMENDED_PROBLEM_ID,
  RESEARCH_HYPOTHESES,
  segmentsForPattern,
  SOLUTION_DIRECTIONS,
  type GrowthPattern,
} from "@/services/analysis/pm-intelligence-narratives";
import type {
  DiscoveryInsight,
  ListeningBehaviour,
  Opportunity,
  PainPoint,
  PMRecommendation,
  PMReport,
  RootCause,
  ThemeCluster,
  UserSegment,
} from "@/types/analysis";
import type { NormalizedReview } from "@/types/reviews";

const QUESTION_TERMS: Record<string, string[]> = {
  d1: ["discover", "new music", "find", "explore", "stuck", "same"],
  d2: ["barrier", "limit", "restrict", "can't", "trust", "wrong"],
  d3: ["same song", "repeat", "familiar", "comfort", "again", "boring"],
  d4: ["recommend", "suggestion", "algorithm", "wrong", "bad", "trust"],
  d5: ["discover weekly", "release radar", "mix", "radio", "ai dj"],
  d6: ["need", "want", "wish", "missing", "unmet"],
  b1: ["listen", "play", "session", "hours", "background"],
  b2: ["want", "trying", "looking for", "need"],
  b3: ["new music", "explore", "discover", "familiar", "comfort"],
  b4: ["friend", "social", "playlist", "recommend", "tiktok"],
  b5: ["same", "repeat", "comfort", "playlist", "favorite"],
  b6: ["study", "work", "gym", "drive", "commute", "sleep"],
  s1: ["free", "premium", "student", "family", "reddit"],
  s2: ["can't find", "discover", "stuck", "frustrat"],
  s3: ["wish", "want", "need", "missing"],
  s4: ["free", "premium", "shuffle", "skip"],
  s5: ["stop", "cancel", "delete", "same", "boring"],
  j1: ["want", "need", "trying", "help me"],
  j2: ["discover", "find", "explore", "new"],
  j3: ["wish", "missing", "doesn't", "can't"],
  p1: ["frustrat", "annoy", "hate", "worst", "broken"],
  p2: ["angry", "terrible", "awful", "useless"],
  r1: ["because", "why", "algorithm", "trust", "wrong"],
  r2: ["trust", "wrong", "bad", "useless", "broken"],
  r3: ["boring", "same", "stop", "quit exploring"],
  r4: ["symptom", "real problem", "underlying"],
  r5: ["ui", "ux", "design", "algorithm", "bug"],
  o1: ["wish", "want", "need", "feature", "add"],
  o2: ["discover", "grow", "retention", "engage"],
  o3: ["ai", "smart", "personal", "learn"],
  o4: ["discover", "new music", "explore"],
  o5: ["apple", "youtube", "amazon", "tidal", "reddit"],
  bi1: ["boring", "leave", "cancel", "delete", "uninstall"],
  bi2: ["same", "repeat", "loop"],
  bi3: ["cancel", "delete", "uninstall", "switch"],
  bi4: ["discover", "recommend", "personal", "algorithm"],
  bi5: ["priority", "fix", "important", "worst"],
};

function buildThemes(reviews: NormalizedReview[]): ThemeCluster[] {
  const ranked = rankGrowthPatterns(reviews).slice(0, 8);
  return ranked.map(({ pattern, matched, count }) => ({
    theme: pattern.label,
    description: pattern.symptom,
    frequency: count,
    representativeQuotes: evidenceQuotesFromReviews(matched),
  }));
}

function buildPainPoints(reviews: NormalizedReview[]): PainPoint[] {
  return rankGrowthPatterns(reviews)
    .filter(({ pattern }) => !pattern.isMonetization || pattern.id === "shuffle_limits")
    .slice(0, 10)
    .map(({ pattern, matched, count }) => ({
      painPoint: pattern.label,
      frequency: count,
      representativeQuotes: evidenceQuotesFromReviews(matched),
    }));
}

function buildRootCauses(reviews: NormalizedReview[]): RootCause[] {
  return rankGrowthPatterns(reviews)
    .filter(({ pattern }) => !pattern.isMonetization)
    .slice(0, 8)
    .map(({ pattern, matched, count }) => {
      const conf = evidenceConfidence(count, reviews.length);
      return {
        complaint: pattern.label,
        inferredRootCause: pattern.aiInterpretation,
        evidenceQuotes: evidenceQuotesFromReviews(matched, 2),
        confidence: conf.value,
      };
    });
}

function buildOpportunities(reviews: NormalizedReview[]): Opportunity[] {
  return rankGrowthPatterns(reviews)
    .filter(({ pattern }) => pattern.growthPriority >= 70)
    .slice(0, 8)
    .map(({ pattern, matched, count }) => {
      const conf = evidenceConfidence(count, reviews.length);
      return {
        opportunity: pattern.growthOpportunity,
        evidence: evidenceQuotesFromReviews(matched, 2),
        affectedSegments: segmentsForPattern(pattern.id, reviews),
        businessImpact: pattern.businessImpact,
        confidence: conf.value,
        priority: pattern.priority,
      };
    });
}

function buildSegments(reviews: NormalizedReview[]): UserSegment[] {
  const personas = assignPersonas(reviews, reviews.length);
  return personas.slice(0, 8).map((p) => ({
    segment: p.name,
    description: p.description,
    estimatedShare: p.estimatedShare,
    keyThemes: p.painPoints,
    representativeQuotes: evidenceQuotesFromReviews(matchReviews(reviews, personaTerms(p.name)), 2),
  }));
}

function personaTerms(name: string): string[] {
  return PERSONA_DEFS.find((p) => p.name === name)?.terms ?? [];
}

function buildListeningBehaviours(reviews: NormalizedReview[]): ListeningBehaviour[] {
  const behaviours = [
    { behaviour: "Active exploration", terms: ["discover", "explore", "new artist"], contexts: ["exploration"] },
    { behaviour: "Comfort replay", terms: ["same", "favorite", "comfort", "repeat"], contexts: ["habitual"] },
    { behaviour: "Background / focus listening", terms: ["study", "work", "focus", "background"], contexts: ["studying", "working"] },
    { behaviour: "Mood-based listening", terms: ["mood", "vibe", "feeling", "sleep"], contexts: ["mood"] },
    { behaviour: "Social discovery", terms: ["friend", "share", "social", "party"], contexts: ["social"] },
    { behaviour: "Commute listening", terms: ["drive", "car", "commute"], contexts: ["commute"] },
  ];
  return behaviours
    .map((b) => {
      const matched = matchReviews(reviews, b.terms);
      return {
        behaviour: b.behaviour,
        frequency: matched.length,
        contexts: b.contexts,
        examples: evidenceQuotesFromReviews(matched, 2),
      };
    })
    .filter((b) => b.frequency > 0)
    .sort((a, b) => b.frequency - a.frequency);
}

function topPatternForQuestion(matched: NormalizedReview[], reviews: NormalizedReview[]): GrowthPattern | undefined {
  const ranked = rankGrowthPatterns(reviews);
  for (const { pattern } of ranked) {
    if (matchReviews(matched, pattern.terms).length > 0) return pattern;
  }
  return ranked[0]?.pattern;
}

function buildDiscoveryInsights(reviews: NormalizedReview[]): DiscoveryInsight[] {
  const insights: DiscoveryInsight[] = [];
  const total = reviews.length;

  for (const mod of DISCOVERY_MODULES) {
    for (const q of mod.questions) {
      const terms = QUESTION_TERMS[q.id] ?? q.question.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matched = matchReviews(reviews, terms);
      const count = matched.length;
      const share = total > 0 ? count / total : 0;
      const topPattern = count > 0 ? topPatternForQuestion(matched, reviews) : undefined;
      const conf = evidenceConfidence(count, total);
      const impact: "low" | "medium" | "high" = share > 0.15 ? "high" : share > 0.05 ? "medium" : "low";

      const finding = buildInsightFinding(q.id, q.question, count, total, topPattern);

      insights.push({
        questionId: q.id,
        question: q.question,
        gist: textGist(finding),
        finding,
        frequency: count,
        evidenceCount: count,
        evidenceSummary: rankGrowthPatterns(matched)
          .slice(0, 3)
          .map(({ pattern }) => pattern.label),
        representativeQuotes: evidenceQuotesFromReviews(matched, 2),
        inferredBehaviour: topPattern?.symptom,
        rootCause: topPattern?.aiInterpretation,
        affectedSegments: topPattern ? segmentsForPattern(topPattern.id, matched) : assignPersonas(matched, matched.length).slice(0, 2).map((p) => p.name),
        businessImpact: impact,
        businessImpactDescription: businessImpactDescription(impact, count),
        aiOpportunity: topPattern?.growthOpportunity,
        confidence: conf.value,
        confidenceRationale: conf.rationale,
        worthSolving: share > 0.08 && (topPattern?.growthPriority ?? 0) >= 70,
        worthSolvingRationale:
          share > 0.08
            ? topPattern?.growthOpportunity ?? "Validate with interviews before prioritizing."
            : "Lower signal volume — use interviews to confirm before investing.",
      });
    }
  }

  return insights;
}

function buildPmRecommendations(opportunities: Opportunity[]): PMRecommendation[] {
  return opportunities.slice(0, 5).map((o) => ({
    title: o.opportunity,
    impact: o.businessImpact,
    confidence: o.confidence,
    rationale: o.evidence[0]?.quote ?? "Cross-review synthesis across discovery-relevant dataset.",
    priority: o.priority,
  }));
}

export function buildOfflineReport(reviews: NormalizedReview[], overview: PMReport["overview"]): PMReport {
  const rating = computeRatingSentimentSplit(reviews);
  const painPoints = buildPainPoints(reviews);
  const themes = buildThemes(reviews);
  const opportunities = buildOpportunities(reviews);
  const personas = assignPersonas(reviews, reviews.length);
  const topGrowth = rankGrowthPatterns(reviews).filter((x) => !x.pattern.isMonetization);
  const topProblems = topGrowth.slice(0, 5).map((x) => x.pattern.label);
  const recommended = CANDIDATE_PROBLEMS.find((p) => p.id === RECOMMENDED_PROBLEM_ID)!;
  const allInterviewQuestions = INTERVIEW_GUIDE.flatMap((g) => g.questions);

  return {
    overview,
    sentiment: {
      positive: rating.positivePct,
      neutral: rating.neutralPct,
      negative: rating.negativePct,
    },
    themes,
    jtbds: [
      {
        job: "Discover new artists without getting stuck in a filter bubble",
        frequency: matchReviews(reviews, ["discover", "new music", "explore"]).length,
        examples: evidenceQuotesFromReviews(matchReviews(reviews, ["discover", "new music"]), 2),
      },
      {
        job: "Match music to current mood or activity (not just history)",
        frequency: matchReviews(reviews, ["mood", "study", "workout", "vibe"]).length,
        examples: evidenceQuotesFromReviews(matchReviews(reviews, ["mood", "study"]), 2),
      },
      {
        job: "Explore without permanently changing taste profile",
        frequency: matchReviews(reviews, ["same", "repeat", "party", "kids"]).length,
        examples: evidenceQuotesFromReviews(matchReviews(reviews, ["same song", "repeat"]), 2),
      },
      {
        job: "Find music when I can't name the artist (mood/scene search)",
        frequency: matchReviews(reviews, ["search", "find", "looking for"]).length,
        examples: evidenceQuotesFromReviews(matchReviews(reviews, ["search", "find"]), 2),
      },
    ].filter((j) => j.frequency > 0),
    painPoints,
    rootCauses: buildRootCauses(reviews),
    segments: buildSegments(reviews),
    opportunities,
    listeningBehaviours: buildListeningBehaviours(reviews),
    personas,
    discoveryInsights: buildDiscoveryInsights(reviews),
    pmRecommendations: buildPmRecommendations(opportunities),
    executiveSummary: {
      topDiscoveryProblems: topProblems,
      topRecommendationFrustrations: painPoints
        .filter((p) => p.painPoint.toLowerCase().includes("recommend") || p.painPoint.toLowerCase().includes("repetitive"))
        .map((p) => p.painPoint)
        .slice(0, 5),
      topUnmetNeeds: opportunities.slice(0, 5).map((o) => o.opportunity),
      topProductOpportunities: opportunities.slice(0, 5).map((o) => o.opportunity),
      emergingUserSegments: personas.slice(0, 6).map((p) => p.name),
      researchHypotheses: RESEARCH_HYPOTHESES,
      candidateProblemStatements: CANDIDATE_PROBLEMS.map((p) => ({
        id: p.id,
        label: p.label,
        statement: p.statement,
      })),
      recommendedProblemId: RECOMMENDED_PROBLEM_ID,
      recommendedProblemStatement: recommended.statement,
      solutionDirections: SOLUTION_DIRECTIONS,
      suggestedInterviewQuestions: allInterviewQuestions,
      interviewGuideByHypothesis: INTERVIEW_GUIDE,
      nextSteps: NEXT_STEPS,
      recommendedPMFocus:
        "Intent-aware recommendations: separate session intent from long-term taste to increase meaningful discovery and reduce repetitive listening.",
      prioritizedRecommendation: opportunities[0]?.opportunity ?? "Intent-aware recommendation layer",
      rationale:
        "Highest Growth alignment across 801 discovery-relevant reviews. Prioritizes recommendation quality and intent over monetization mechanics.",
    },
    advancedAnalysis: {
      competitive: {
        competitors: ["Apple Music", "YouTube Music", "Amazon Music"],
        requestedFeatures: evidenceQuotesFromReviews(matchReviews(reviews, ["apple", "youtube", "amazon", "tidal"]), 3).map((q) => q.quote),
        comparisonReasons: evidenceQuotesFromReviews(matchReviews(reviews, ["better than", "switch to", "moved to"]), 2),
      },
      sentiment: {
        positiveThemes: themes.filter((t) => t.frequency > 0).slice(0, 3).map((t) => t.theme),
        negativeThemes: topProblems,
        polarizingTopics: ["Discover Weekly", "AI DJ", "Free-tier limits"],
      },
      featureRequests: {
        topRequests: opportunities.slice(0, 5).map((o) => o.opportunity),
        crossPlatformRequests: evidenceQuotesFromReviews(matchReviews(reviews, ["sync", "device", "cross"]), 3),
      },
    },
    summary: {
      topProblems: topProblems,
      topOpportunities: opportunities.slice(0, 5).map((o) => o.opportunity),
      biggestRisks: [
        "Recommendation loops reduce meaningful discovery and exploratory sessions",
        "Algorithm skepticism pushes users to manual search or competitors",
        "Intent blindness causes mood/context mismatches at scale",
      ],
      keyInsights: [
        `${reviews.length} discovery-relevant reviews synthesized with Growth-focused intelligence engine.`,
        `Primary strategic direction: Intent-aware recommendations (Problem A).`,
        `Sentiment among rated reviews: ${rating.positivePct}% positive, ${rating.negativePct}% negative.`,
      ],
    },
  };
}

export function runOfflineAnalysis(
  reviews: NormalizedReview[],
  opts: { totalLoaded?: number; onProgress?: (message: string) => void } = {},
): { report: PMReport; warnings: string[] } {
  opts.onProgress?.("Synthesizing Product Intelligence across discovery dataset...");

  const cleaned = reviews
    .map((r) => ({ ...r, title: (r.title || "").trim(), body: (r.body || "").trim() }))
    .filter((r) => r.title.length > 0 || r.body.length > 0);

  const sources: Record<string, number> = {};
  for (const r of cleaned) sources[r.source] = (sources[r.source] ?? 0) + 1;

  const overview: PMReport["overview"] = {
    totalReviewsAnalyzed: cleaned.length,
    sources,
    scope: "discovery",
    totalLoaded: opts.totalLoaded ?? cleaned.length,
  };

  opts.onProgress?.("Building themes, personas, and executive summary...");
  const report = buildOfflineReport(cleaned, overview);

  const warnings = [
    `Product Intelligence synthesized from all ${cleaned.length} discovery-relevant reviews.`,
    "Cerebras quota unavailable — report generated via evidence-weighted narrative engine (re-run with AI when quota resets for additional depth).",
  ];

  return { report, warnings };
}
