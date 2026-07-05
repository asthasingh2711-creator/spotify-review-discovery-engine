export type DiscoveryModule = {
  id: string;
  title: string;
  dashboardTab: string;
  questions: { id: string; question: string }[];
};

export const DISCOVERY_MODULES: DiscoveryModule[] = [
  {
    id: "discovery",
    title: "Discovery Intelligence",
    dashboardTab: "discovery",
    questions: [
      { id: "d1", question: "Why do users struggle to discover new music?" },
      { id: "d2", question: "What are the biggest barriers to meaningful music discovery?" },
      { id: "d3", question: "What causes users to repeatedly listen to familiar songs, artists, or playlists?" },
      { id: "d4", question: "What recommendation frustrations occur most frequently?" },
      { id: "d5", question: "Which recommendation features receive the strongest positive and negative feedback?" },
      { id: "d6", question: "Which unmet discovery needs appear consistently across reviews?" },
    ],
  },
  {
    id: "behaviour",
    title: "Listening Behaviour",
    dashboardTab: "behaviour",
    questions: [
      { id: "b1", question: "What listening behaviours emerge consistently across reviews?" },
      { id: "b2", question: "What are users trying to achieve when they open Spotify?" },
      { id: "b3", question: "When do users intentionally seek new music versus familiar music?" },
      { id: "b4", question: "What triggers exploratory listening?" },
      { id: "b5", question: "What triggers repetitive listening?" },
      { id: "b6", question: "Which listening contexts most influence discovery behaviour?" },
    ],
  },
  {
    id: "segments",
    title: "User Segments",
    dashboardTab: "segments",
    questions: [
      { id: "s1", question: "Which user segments emerge naturally from the reviews?" },
      { id: "s2", question: "Which segments struggle most with music discovery?" },
      { id: "s3", question: "Which segments express the strongest unmet discovery needs?" },
      { id: "s4", question: "How do Free and Premium users differ in discovery behaviour?" },
      { id: "s5", question: "Which users are most likely to stop exploring new music?" },
    ],
  },
  {
    id: "jtbd",
    title: "JTBD & Pain Points",
    dashboardTab: "jtbd",
    questions: [
      { id: "j1", question: "What are users fundamentally trying to accomplish?" },
      { id: "j2", question: "Which discovery-related JTBD occur most frequently?" },
      { id: "j3", question: "Which JTBD are currently underserved?" },
      { id: "p1", question: "What are the biggest pain points preventing successful discovery?" },
      { id: "p2", question: "Which pain points create the greatest frustration?" },
    ],
  },
  {
    id: "rootcause",
    title: "Root Causes",
    dashboardTab: "rootcauses",
    questions: [
      { id: "r1", question: "What are the root causes behind discovery complaints?" },
      { id: "r2", question: "Why do users lose trust in recommendations?" },
      { id: "r3", question: "Why do users stop exploring new music?" },
      { id: "r4", question: "Which problems are symptoms versus underlying causes?" },
      { id: "r5", question: "Which issues are algorithmic versus UX-related?" },
    ],
  },
  {
    id: "opportunity",
    title: "AI Opportunity Analysis",
    dashboardTab: "opportunities",
    questions: [
      { id: "o1", question: "Which unmet needs emerge consistently?" },
      { id: "o2", question: "Which opportunities align with Spotify's Growth objectives?" },
      { id: "o3", question: "Which opportunities are uniquely enabled by AI?" },
      { id: "o4", question: "Which opportunities would most improve meaningful music discovery?" },
      { id: "o5", question: "Which opportunities appear across multiple platforms?" },
    ],
  },
  {
    id: "business",
    title: "Business Impact",
    dashboardTab: "business",
    questions: [
      { id: "bi1", question: "Which discovery problems most reduce engagement?" },
      { id: "bi2", question: "Which problems likely increase repetitive listening?" },
      { id: "bi3", question: "Which issues are most likely to impact retention?" },
      { id: "bi4", question: "Which opportunities offer the highest business impact?" },
      { id: "bi5", question: "Which problems should the Growth Team prioritize?" },
    ],
  },
];

export const EXECUTIVE_SUMMARY_FIELDS = [
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
] as const;
