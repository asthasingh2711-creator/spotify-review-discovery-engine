import { coerceEvidenceQuotes } from "@/lib/evidence-quote";

type Impact = "low" | "medium" | "high";
type Priority = "p0" | "p1" | "p2";

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter(Boolean);
}

function asImpact(v: unknown): Impact {
  const s = asString(v).toLowerCase();
  if (s === "low" || s === "medium" || s === "high") return s;
  return "medium";
}

function asPriority(v: unknown): Priority {
  const s = asString(v).toLowerCase();
  if (s === "p0" || s === "p1" || s === "p2") return s;
  return "p1";
}

function normalizeSentiment(raw: unknown, fallback?: { positive: number; neutral: number; negative: number }) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return {
      positive: asNumber(o.positive, fallback?.positive ?? 0),
      neutral: asNumber(o.neutral, fallback?.neutral ?? 0),
      negative: asNumber(o.negative, fallback?.negative ?? 0),
    };
  }
  if (fallback) return fallback;
  return { positive: 0, neutral: 0, negative: 0 };
}

function normalizeThemes(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return {
        theme: item,
        description: item,
        frequency: 1,
        representativeQuotes: [],
      };
    }
    const o = (item ?? {}) as Record<string, unknown>;
    const quotes = coerceEvidenceQuotes(o.representativeQuotes);
    return {
      theme: asString(o.theme, `Theme ${i + 1}`),
      description: asString(o.description, asString(o.theme)),
      frequency: asNumber(o.frequency, 1),
      representativeQuotes: quotes.filter((q) => q.quote),
    };
  });
}

function normalizeNamedFreq(raw: unknown, nameKey: string, fallbackPrefix: string) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return { [nameKey]: item, frequency: 1, representativeQuotes: [] };
    }
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      [nameKey]: asString(o[nameKey], `${fallbackPrefix} ${i + 1}`),
      frequency: asNumber(o.frequency, 1),
      representativeQuotes: coerceEvidenceQuotes(o.representativeQuotes),
    };
  });
}

function normalizeJtbds(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") return { job: item, frequency: 1, examples: [] };
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      job: asString(o.job, `Job ${i + 1}`),
      frequency: asNumber(o.frequency, 1),
      examples: coerceEvidenceQuotes(o.examples),
    };
  });
}

function normalizeRootCauses(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return {
        complaint: item,
        inferredRootCause: item,
        evidenceQuotes: [] as never[],
        confidence: 0.5,
      };
    }
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      complaint: asString(o.complaint, `Complaint ${i + 1}`),
      inferredRootCause: asString(o.inferredRootCause, asString(o.complaint)),
      evidenceQuotes: coerceEvidenceQuotes(o.evidenceQuotes),
      confidence: asNumber(o.confidence, 0.5),
    };
  });
}

function normalizeSegments(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return {
        segment: item,
        description: item,
        estimatedShare: 0.1,
        keyThemes: [] as string[],
        representativeQuotes: [] as string[],
      };
    }
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      segment: asString(o.segment, `Segment ${i + 1}`),
      description: asString(o.description, asString(o.segment)),
      estimatedShare: asNumber(o.estimatedShare, 0.1),
      keyThemes: asStringArray(o.keyThemes),
      representativeQuotes: coerceEvidenceQuotes(o.representativeQuotes),
    };
  });
}

function normalizeOpportunities(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return {
        opportunity: item,
        evidence: [] as never[],
        affectedSegments: [] as string[],
        businessImpact: "medium" as Impact,
        confidence: 0.5,
        priority: "p1" as Priority,
      };
    }
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      opportunity: asString(o.opportunity, `Opportunity ${i + 1}`),
      evidence: coerceEvidenceQuotes(o.evidence),
      affectedSegments: asStringArray(o.affectedSegments),
      businessImpact: asImpact(o.businessImpact),
      confidence: asNumber(o.confidence, 0.5),
      priority: asPriority(o.priority),
    };
  });
}

function normalizeSolutionDirections(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      const o = item as Record<string, unknown>;
      const dir = asString(o.direction ?? o.solution ?? o.title ?? o.label);
      const pros = asString(o.pros);
      const cons = asString(o.cons);
      if (!dir && !pros && !cons) return "";
      if (pros || cons) {
        return [dir, pros && `Pros: ${pros}`, cons && `Cons: ${cons}`].filter(Boolean).join(" · ");
      }
      return dir;
    })
    .filter(Boolean);
}

function normalizeInterviewGuide(raw: unknown) {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const hypothesis = asString(o.hypothesis);
      const questions = asStringArray(o.questions);
      if (!hypothesis || !questions.length) return null;
      return { hypothesis, questions };
    })
    .filter((x): x is { hypothesis: string; questions: string[] } => x != null);
}

function normalizeDiscoveryInsights(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const questionId = asString(o.questionId, `q${i + 1}`);
      const question = asString(o.question);
      const finding = asString(o.finding ?? o.answer);
      if (!question && !finding) return null;
      const evidenceCount = Math.max(0, Math.round(asNumber(o.evidenceCount, asNumber(o.frequency, 0))));
      return {
        questionId,
        question,
        gist: o.gist ? asString(o.gist) : undefined,
        finding,
        answer: o.answer ? asString(o.answer) : undefined,
        frequency: evidenceCount,
        evidenceCount,
        evidenceSummary: asStringArray(o.evidenceSummary),
        representativeQuotes: coerceEvidenceQuotes(o.representativeQuotes),
        inferredBehaviour: o.inferredBehaviour ? asString(o.inferredBehaviour) : undefined,
        rootCause: o.rootCause ? asString(o.rootCause) : undefined,
        affectedSegments: asStringArray(o.affectedSegments),
        businessImpact: o.businessImpact ? asImpact(o.businessImpact) : undefined,
        businessImpactDescription: o.businessImpactDescription ? asString(o.businessImpactDescription) : undefined,
        aiOpportunity: o.aiOpportunity ? asString(o.aiOpportunity) : undefined,
        confidence: Math.min(1, Math.max(0, asNumber(o.confidence, 0.5))),
        confidenceRationale: o.confidenceRationale ? asString(o.confidenceRationale) : undefined,
        worthSolving: typeof o.worthSolving === "boolean" ? o.worthSolving : undefined,
        worthSolvingRationale: o.worthSolvingRationale ? asString(o.worthSolvingRationale) : undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

function normalizePersonas(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (!item || typeof item !== "object") {
      return {
        name: `Persona ${i + 1}`,
        description: asString(item),
        goals: [] as string[],
        painPoints: [] as string[],
        discoveryBarriers: [] as string[],
        opportunities: [] as string[],
        estimatedShare: 0.1,
      };
    }
    const o = item as Record<string, unknown>;
    return {
      name: asString(o.name, `Persona ${i + 1}`),
      description: asString(o.description),
      goals: asStringArray(o.goals),
      painPoints: asStringArray(o.painPoints),
      discoveryBarriers: asStringArray(o.discoveryBarriers),
      opportunities: asStringArray(o.opportunities),
      estimatedShare: asNumber(o.estimatedShare, 0.1),
    };
  });
}

function normalizePmRecommendations(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return {
        title: item,
        impact: "medium" as Impact,
        confidence: 0.5,
        rationale: item,
        priority: "p1" as Priority,
      };
    }
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      title: asString(o.title, `Recommendation ${i + 1}`),
      impact: asImpact(o.impact),
      confidence: asNumber(o.confidence, 0.5),
      rationale: asString(o.rationale, asString(o.title)),
      priority: asPriority(o.priority),
    };
  });
}

function normalizeExecutiveSummary(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const candidateProblemStatements = Array.isArray(o.candidateProblemStatements)
    ? o.candidateProblemStatements
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const c = item as Record<string, unknown>;
          const id = asString(c.id);
          const label = asString(c.label);
          const statement = asString(c.statement);
          if (!id || !statement) return null;
          return { id, label: label || id, statement };
        })
        .filter((x): x is { id: string; label: string; statement: string } => x != null)
    : undefined;

  return {
    topFrustrations: asStringArray(o.topFrustrations),
    topUnmetNeeds: asStringArray(o.topUnmetNeeds),
    topDiscoveryBarriers: asStringArray(o.topDiscoveryBarriers),
    topOpportunities: asStringArray(o.topOpportunities),
    emergingSegments: asStringArray(o.emergingSegments),
    recommendedProblemStatement: asString(o.recommendedProblemStatement),
    candidateProblemStatements: candidateProblemStatements?.length ? candidateProblemStatements : undefined,
    recommendedProblemId: o.recommendedProblemId ? asString(o.recommendedProblemId) : undefined,
    solutionDirections: normalizeSolutionDirections(o.solutionDirections),
    prioritizedRecommendation: asString(o.prioritizedRecommendation),
    rationale: asString(o.rationale),
    suggestedInterviewQuestions: asStringArray(o.suggestedInterviewQuestions),
    interviewGuideByHypothesis: normalizeInterviewGuide(o.interviewGuideByHypothesis),
    nextSteps: asStringArray(o.nextSteps),
    topDiscoveryProblems: asStringArray(o.topDiscoveryProblems),
    topRecommendationFrustrations: asStringArray(o.topRecommendationFrustrations),
    topProductOpportunities: asStringArray(o.topProductOpportunities),
    emergingUserSegments: asStringArray(o.emergingUserSegments),
    researchHypotheses: asStringArray(o.researchHypotheses),
    recommendedPMFocus: asString(o.recommendedPMFocus),
  };
}

function normalizeStringOrQuoteList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "quote" in item) {
        return asString((item as Record<string, unknown>).quote);
      }
      return asString(item);
    })
    .filter(Boolean);
}

function normalizeAdvancedAnalysis(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const competitive =
    o.competitive && typeof o.competitive === "object"
      ? (() => {
          const c = o.competitive as Record<string, unknown>;
          return {
            competitors: asStringArray(c.competitors),
            requestedFeatures: normalizeStringOrQuoteList(c.requestedFeatures),
            comparisonReasons: normalizeStringOrQuoteList(c.comparisonReasons),
          };
        })()
      : undefined;
  const sentiment =
    o.sentiment && typeof o.sentiment === "object"
      ? (() => {
          const s = o.sentiment as Record<string, unknown>;
          return {
            positiveThemes: asStringArray(s.positiveThemes),
            negativeThemes: asStringArray(s.negativeThemes),
            polarizingTopics: asStringArray(s.polarizingTopics),
          };
        })()
      : undefined;
  const featureRequests =
    o.featureRequests && typeof o.featureRequests === "object"
      ? (() => {
          const f = o.featureRequests as Record<string, unknown>;
          return {
            topRequests: asStringArray(f.topRequests),
            crossPlatformRequests: normalizeStringOrQuoteList(f.crossPlatformRequests),
          };
        })()
      : undefined;
  if (!competitive && !sentiment && !featureRequests) return undefined;
  return { competitive, sentiment, featureRequests };
}

function normalizeListening(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "string") {
      return { behaviour: item, frequency: 1, contexts: [] as string[], examples: [] };
    }
    const o = (item ?? {}) as Record<string, unknown>;
    const freq = asNumber(o.frequency, 1);
    return {
      behaviour: asString(o.behaviour, `Behaviour ${i + 1}`),
      frequency: freq < 1 ? Math.max(1, Math.round(freq * 100)) : Math.max(1, Math.round(freq)),
      contexts: asStringArray(o.contexts),
      examples: coerceEvidenceQuotes(o.examples),
    };
  });
}

function normalizeSummary(raw: unknown) {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    topProblems: asStringArray(o.topProblems),
    topOpportunities: asStringArray(o.topOpportunities),
    biggestRisks: asStringArray(o.biggestRisks),
    keyInsights: asStringArray(o.keyInsights),
  };
}

/** Coerce loosely-typed LLM JSON into the shape expected by BatchReportSchema. */
export function normalizeBatchReport(
  raw: unknown,
  opts: { sentimentFallback?: { positive: number; neutral: number; negative: number } } = {},
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;

  const painPoints = normalizeNamedFreq(o.painPoints, "painPoint", "Pain point").map((p) => ({
    painPoint: p.painPoint as string,
    frequency: p.frequency as number,
    representativeQuotes: p.representativeQuotes,
  }));

  return {
    sentiment: normalizeSentiment(o.sentiment, opts.sentimentFallback),
    themes: normalizeThemes(o.themes),
    jtbds: normalizeJtbds(o.jtbds),
    painPoints,
    rootCauses: normalizeRootCauses(o.rootCauses),
    segments: normalizeSegments(o.segments),
    opportunities: normalizeOpportunities(o.opportunities),
    listeningBehaviours: normalizeListening(o.listeningBehaviours),
    personas: normalizePersonas(o.personas),
    discoveryInsights: normalizeDiscoveryInsights(o.discoveryInsights),
    pmRecommendations: normalizePmRecommendations(o.pmRecommendations),
    executiveSummary: normalizeExecutiveSummary(o.executiveSummary),
    advancedAnalysis: normalizeAdvancedAnalysis(o.advancedAnalysis),
    summary: normalizeSummary(o.summary),
  };
}
