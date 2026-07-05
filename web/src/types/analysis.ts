import type { SentimentLabel } from "@/types/reviews";

export type AnalysisScope = "all" | "discovery";

export type EvidenceQuote = {
  quote: string;
  source?: string;
  date?: string;
  url?: string;
  author?: string;
};

export type ThemeCluster = {
  theme: string;
  description: string;
  frequency: number;
  representativeQuotes: EvidenceQuote[];
};

export type JTBDGroup = {
  job: string;
  frequency: number;
  examples: EvidenceQuote[];
};

export type PainPoint = {
  painPoint: string;
  frequency: number;
  representativeQuotes: EvidenceQuote[];
};

export type RootCause = {
  complaint: string;
  inferredRootCause: string;
  evidenceQuotes: EvidenceQuote[];
  confidence: number;
};

export type UserSegment = {
  segment: string;
  description: string;
  estimatedShare: number;
  keyThemes: string[];
  representativeQuotes: EvidenceQuote[];
};

export type Opportunity = {
  opportunity: string;
  evidence: EvidenceQuote[];
  affectedSegments: string[];
  businessImpact: "low" | "medium" | "high";
  confidence: number;
  priority: "p0" | "p1" | "p2";
};

export type ListeningBehaviour = {
  behaviour: string;
  frequency: number;
  contexts: string[];
  examples: EvidenceQuote[];
};

export type Persona = {
  name: string;
  description: string;
  goals: string[];
  painPoints: string[];
  discoveryBarriers: string[];
  opportunities: string[];
  estimatedShare: number;
};

export type DiscoveryInsight = {
  questionId: string;
  question: string;
  gist?: string;
  finding?: string;
  answer?: string;
  frequency?: number;
  evidenceCount: number;
  evidenceSummary: string[];
  representativeQuotes: EvidenceQuote[];
  inferredBehaviour?: string;
  rootCause?: string;
  affectedSegments?: string[];
  businessImpact?: "low" | "medium" | "high";
  businessImpactDescription?: string;
  aiOpportunity?: string;
  confidence: number;
  confidenceRationale?: string;
  worthSolving?: boolean;
  worthSolvingRationale?: string;
};

export type CandidateProblemStatement = {
  id: string;
  label: string;
  statement: string;
};

export type InterviewGuideGroup = {
  hypothesis: string;
  questions: string[];
};

export type PMRecommendation = {
  title: string;
  impact: "low" | "medium" | "high";
  confidence: number;
  rationale: string;
  priority: "p0" | "p1" | "p2";
};

export type ExecutiveSummary = {
  topFrustrations?: string[];
  topUnmetNeeds?: string[];
  topDiscoveryBarriers?: string[];
  topOpportunities?: string[];
  emergingSegments?: string[];
  recommendedProblemStatement?: string;
  candidateProblemStatements?: CandidateProblemStatement[];
  recommendedProblemId?: string;
  solutionDirections?: string[];
  prioritizedRecommendation?: string;
  rationale?: string;
  suggestedInterviewQuestions?: string[];
  interviewGuideByHypothesis?: InterviewGuideGroup[];
  nextSteps?: string[];
  topDiscoveryProblems?: string[];
  topRecommendationFrustrations?: string[];
  topProductOpportunities?: string[];
  emergingUserSegments?: string[];
  researchHypotheses?: string[];
  recommendedPMFocus?: string;
};

export type AdvancedAnalysis = {
  competitive?: {
    competitors: string[];
    requestedFeatures: string[];
    comparisonReasons: Array<string | EvidenceQuote>;
  };
  sentiment?: {
    positiveThemes: string[];
    negativeThemes: string[];
    polarizingTopics: string[];
  };
  featureRequests?: {
    topRequests: string[];
    crossPlatformRequests: Array<string | EvidenceQuote>;
  };
};

export type PMReport = {
  overview: {
    totalReviewsAnalyzed: number;
    dateRange?: { start?: string; end?: string };
    sources: Record<string, number>;
    scope?: AnalysisScope;
    totalLoaded?: number;
  };
  sentiment: Record<SentimentLabel, number>;
  themes: ThemeCluster[];
  jtbds: JTBDGroup[];
  painPoints: PainPoint[];
  rootCauses: RootCause[];
  segments: UserSegment[];
  opportunities: Opportunity[];
  listeningBehaviours?: ListeningBehaviour[];
  personas?: Persona[];
  discoveryInsights?: DiscoveryInsight[];
  pmRecommendations?: PMRecommendation[];
  executiveSummary?: ExecutiveSummary;
  advancedAnalysis?: AdvancedAnalysis;
  summary: {
    topProblems: string[];
    topOpportunities: string[];
    biggestRisks: string[];
    keyInsights: string[];
  };
};

export type AnalyzeResponse = {
  report: PMReport;
  warnings: string[];
  scope?: AnalysisScope;
};

export type IntelligenceTab =
  | "discovery"
  | "behaviour"
  | "segments"
  | "jtbd"
  | "rootcauses"
  | "opportunities"
  | "business"
  | "report";
