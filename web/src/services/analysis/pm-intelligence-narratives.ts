import type { NormalizedReview } from "@/types/reviews";

export type GrowthPattern = {
  id: string;
  label: string;
  terms: string[];
  symptom: string;
  aiInterpretation: string;
  growthOpportunity: string;
  growthPriority: number;
  businessImpact: "low" | "medium" | "high";
  priority: "p0" | "p1" | "p2";
  isMonetization?: boolean;
};

export const GROWTH_PATTERNS: GrowthPattern[] = [
  {
    id: "bad_recs",
    label: "Irrelevant or poor recommendations",
    terms: ["recommend", "suggestion", "algorithm", "wrong music", "doesn't know", "bad mix", "not my taste", "doesn't match"],
    symptom: "Users describe recommendations that feel misaligned with taste, mood, or moment.",
    aiInterpretation:
      "Users repeatedly describe recommendation fatigue after prolonged listening. Rather than lacking recommendations, users describe losing trust because the system over-personalizes around historical behaviour and underweights temporary intent. This creates a reinforcement loop where familiar content dominates despite stated desire for discovery.",
    growthOpportunity: "Intent-aware recommendation layer that separates session intent from long-term taste profile.",
    growthPriority: 100,
    businessImpact: "high",
    priority: "p0",
  },
  {
    id: "repetitive",
    label: "Repetitive listening & recommendation loops",
    terms: ["same song", "repeat", "repetitive", "over and over", "hear again", "stuck in a loop", "boring"],
    symptom: "Users hear the same tracks and artists despite wanting variety.",
    aiInterpretation:
      "Repetitive listening is often a symptom of weak novelty control — not user preference. Reviews suggest Spotify optimizes for engagement depth on known content, so exploratory sessions collapse back into comfort listening. Users want discovery without permanently reshaping their taste graph.",
    growthOpportunity: "Novelty controls and session-scoped recommendations that do not permanently alter the profile.",
    growthPriority: 98,
    businessImpact: "high",
    priority: "p0",
  },
  {
    id: "home_feed",
    label: "Home feed & For You staleness",
    terms: ["home", "feed", "for you", "main page", "dashboard", "stale"],
    symptom: "Home surfaces feel dominated by familiar content.",
    aiInterpretation:
      "The home feed appears optimized for habitual return rather than exploratory return. Users describe opening Spotify with intent to discover, but the surface rewards repeat consumption. This misaligns product surfaces with the Growth objective of meaningful discovery.",
    growthOpportunity: "Context-aware home modules that rotate discovery pathways based on session intent.",
    growthPriority: 92,
    businessImpact: "high",
    priority: "p0",
  },
  {
    id: "explore",
    label: "Explore & new music pathways",
    terms: ["explore", "new music", "discovery", "discover", "new artist", "find new"],
    symptom: "Users explicitly want more pathways to unfamiliar music.",
    aiInterpretation:
      "Discovery hunger is present — users are not rejecting new music. They struggle to find trustworthy entry points. When discovery works (Discover Weekly, friend shares), sentiment is strongly positive; the gap is reliable, repeatable discovery journeys.",
    growthOpportunity: "Curated discovery journeys with explain-why recommendations and lower-risk exploration modes.",
    growthPriority: 90,
    businessImpact: "high",
    priority: "p0",
  },
  {
    id: "genre_mood",
    label: "Genre & mood-context matching",
    terms: ["genre", "mood", "vibe", "feeling", "study", "workout", "sleep", "context"],
    symptom: "Users want music that fits how they feel right now, not just what they liked before.",
    aiInterpretation:
      "Listening intent is contextual and temporary. Reviews imply Spotify conflates 'what I played yesterday' with 'what I want now', especially for study, workout, and mood sessions. An AI layer can interpret conversational intent where collaborative filtering fails.",
    growthOpportunity: "Intent-aware playlists and mood-native discovery search.",
    growthPriority: 88,
    businessImpact: "high",
    priority: "p1",
  },
  {
    id: "discover_weekly",
    label: "Discover Weekly / Release Radar quality",
    terms: ["discover weekly", "release radar", "daily mix", "made for you"],
    symptom: "Flagship discovery playlists under-deliver on freshness and relevance.",
    aiInterpretation:
      "Users treat Discover Weekly as a benchmark for whether Spotify 'knows' them. When it misses, trust in the entire recommendation stack erodes — not just one playlist.",
    growthOpportunity: "Refresh signals and transparent taste explanations for flagship discovery products.",
    growthPriority: 85,
    businessImpact: "high",
    priority: "p1",
  },
  {
    id: "search",
    label: "Discovery-oriented search gaps",
    terms: ["search", "can't find", "find music", "hard to find", "looking for"],
    symptom: "Users know what they want to feel but struggle to translate that into queries.",
    aiInterpretation:
      "Search friction blocks discovery for users who think in moods, scenes, and lyrics — not artist names. This is a strong signal for AI-native discovery search layered on top of catalog search.",
    growthOpportunity: "AI Discovery Search: natural-language queries for mood, scene, and intent.",
    growthPriority: 82,
    businessImpact: "medium",
    priority: "p1",
  },
  {
    id: "ai_dj",
    label: "AI DJ & guided discovery modes",
    terms: ["ai dj", " dj ", "voice", "radio", "autoplay"],
    symptom: "Mixed feedback on AI-led listening sessions.",
    aiInterpretation:
      "Users want guidance without losing control. Opaque transitions and inability to steer AI sessions create skepticism toward AI discovery — even when the underlying catalog breadth is valued.",
    growthOpportunity: "Steerable AI sessions with explicit intent capture at session start.",
    growthPriority: 75,
    businessImpact: "medium",
    priority: "p2",
  },
  {
    id: "shuffle_limits",
    label: "Free-tier playback restrictions",
    terms: ["shuffle", "premium", "subscription", "paywall", "free tier", "can't play"],
    symptom: "Playback limits interfere with intentional listening.",
    aiInterpretation:
      "Monetization friction appears frequently but is adjacent to the Growth discovery mandate. It blocks exploration for free users, yet solving shuffle alone does not increase meaningful discovery for Premium listeners.",
    growthOpportunity: "Discovery-mode free tier — limited on-demand but rich exploratory surfaces.",
    growthPriority: 35,
    businessImpact: "medium",
    priority: "p2",
    isMonetization: true,
  },
  {
    id: "playlist",
    label: "Playlist & queue mechanics",
    terms: ["queue", "blend", "curate"],
    symptom: "Curation and queue friction during active listening.",
    aiInterpretation:
      "Playlist mechanics matter for power users but are secondary to recommendation quality for the Growth discovery objective.",
    growthOpportunity: "Lower-priority UX polish unless tied to collaborative discovery.",
    growthPriority: 30,
    businessImpact: "low",
    priority: "p2",
    isMonetization: false,
  },
];

export type PersonaDef = {
  name: string;
  terms: string[];
  description: string;
  goals: string[];
  painPoints: string[];
  discoveryBarriers: string[];
  opportunities: string[];
};

export const PERSONA_DEFS: PersonaDef[] = [
  {
    name: "Explorer",
    terms: ["discover", "new music", "explore", "new artist", "find new"],
    description: "Actively seeks unfamiliar music and judges Spotify by how often it surprises them well.",
    goals: ["Break filter bubbles", "Find artists they'll keep"],
    painPoints: ["Stale recommendations", "Weak novelty"],
    discoveryBarriers: ["Over-personalization on history"],
    opportunities: ["Novelty slider", "Explain-why recs"],
  },
  {
    name: "Comfort Listener",
    terms: ["same", "favorite", "comfort", "repeat", "again"],
    description: "Defaults to familiar tracks; discovery is occasional and low-risk.",
    goals: ["Reliable favorites", "Low-effort listening"],
    painPoints: ["Unwanted novelty", "Shuffle surprises"],
    discoveryBarriers: ["Discovery interrupts routine"],
    opportunities: ["Separate comfort vs explore modes"],
  },
  {
    name: "Routine Listener",
    terms: ["every day", "daily", "morning", "commute", "routine", "habit"],
    description: "Listens in predictable contexts; wants Spotify to match the moment.",
    goals: ["Match time-of-day context", "Hands-free listening"],
    painPoints: ["Wrong mood suggestions", "Feed staleness"],
    discoveryBarriers: ["Context not detected"],
    opportunities: ["Intent-aware home feed"],
  },
  {
    name: "Mood Listener",
    terms: ["mood", "vibe", "feeling", "study", "workout", "sleep", "focus"],
    description: "Thinks in moods and activities; discovery is contextual.",
    goals: ["Right music for right now", "Genre/mood fit"],
    painPoints: ["Misaligned recommendations", "Genre drift"],
    discoveryBarriers: ["Historical taste overrides intent"],
    opportunities: ["Mood-native discovery search"],
  },
  {
    name: "Algorithm Skeptic",
    terms: ["algorithm", "wrong", "trust", "useless", "broken", "doesn't know"],
    description: "Lost trust in recommendations; manually searches or uses playlists.",
    goals: ["Regain control", "Understand why songs appear"],
    painPoints: ["Opaque recommendations", "Repetitive loops"],
    discoveryBarriers: ["Low algorithm trust"],
    opportunities: ["Transparent taste controls", "Guest sessions"],
  },
  {
    name: "Playlist Collector",
    terms: ["playlist", "curate", "collection", "organize", "library"],
    description: "Invests in curation; discovery happens through manual assembly.",
    goals: ["Organize taste", "Share collections"],
    painPoints: ["Queue friction", "Sync issues"],
    discoveryBarriers: ["Discovery not integrated with curation"],
    opportunities: ["Smart playlist suggestions by intent"],
  },
  {
    name: "Social Curator",
    terms: ["friend", "share", "social", "party", "collab"],
    description: "Discovers through people; values shared and collaborative listening.",
    goals: ["Share discoveries", "Group listening"],
    painPoints: ["Weak social discovery loops"],
    discoveryBarriers: ["Discovery is solo-by-default"],
    opportunities: ["Social discovery pathways"],
  },
  {
    name: "Free-tier Explorer",
    terms: ["free", "shuffle", "skip", "premium", "subscription"],
    description: "Explores within free-tier constraints; discovery competes with paywalls.",
    goals: ["Sample before subscribing", "Control playback"],
    painPoints: ["Shuffle limits", "Skip caps"],
    discoveryBarriers: ["Can't pick tracks on demand"],
    opportunities: ["Discovery-mode free tier"],
  },
];

export const CANDIDATE_PROBLEMS = [
  {
    id: "intent",
    label: "Problem A — Intent vs history",
    statement:
      "Spotify cannot reliably distinguish temporary listening intent from long-term taste, causing recommendations to reinforce familiar listening even when users want discovery.",
  },
  {
    id: "trust",
    label: "Problem B — Recommendation trust",
    statement:
      "Users lose trust in Spotify's recommendation system after repeated irrelevant suggestions, leading them to manually search or disengage from algorithmic discovery surfaces.",
  },
  {
    id: "memory",
    label: "Problem C — Taste memory",
    statement:
      "Users want to explore music without permanently altering their recommendation profile (party music, children's songs, one-off moods), but Spotify treats all listening as taste signal.",
  },
] as const;

export const RECOMMENDED_PROBLEM_ID = "intent";

export const RESEARCH_HYPOTHESES = [
  "Users would explore more if recommendations distinguished session intent from long-term taste.",
  "Transparent novelty controls would reduce repetitive-listening complaints without hurting engagement.",
  "AI-native discovery search (mood/scene queries) would unlock discovery for users who cannot articulate artist names.",
  "Guest or ephemeral listening modes would increase experimentation among Algorithm Skeptics.",
  "Context-aware home surfaces would increase exploratory sessions among Routine and Mood listeners.",
];

export const INTERVIEW_GUIDE: { hypothesis: string; questions: string[] }[] = [
  {
    hypothesis: "Intent vs historical taste drives repetitive recommendations",
    questions: [
      "Walk me through the last time you opened Spotify wanting something new — what did you tap first?",
      "When recommendations feel wrong, do they feel wrong for your mood or wrong for your overall taste?",
      "Have you ever wanted music for a moment (study, party, workout) that you did NOT want reflected in your taste profile?",
      "What would 'reset my recommendations for tonight only' mean to you?",
    ],
  },
  {
    hypothesis: "Novelty controls would restore trust without hurting comfort listening",
    questions: [
      "How do you balance familiar music vs new music in a typical week?",
      "Would you use a slider for 'more surprising' vs 'more familiar' recommendations? When?",
      "What made you lose trust in Spotify recommendations — can you describe a specific incident?",
      "What would Spotify need to show you to trust a surprising recommendation?",
    ],
  },
  {
    hypothesis: "AI discovery search unlocks users who think in moods not artists",
    questions: [
      "When you can't name a song, how do you try to find music that fits your mood?",
      "Describe a time you knew the vibe you wanted but couldn't find it on Spotify.",
      "Would you use a chat-style search like 'songs for late-night coding' — why or why not?",
      "How is mood-based search different from browsing genres for you?",
    ],
  },
  {
    hypothesis: "Ephemeral listening increases experimentation",
    questions: [
      "Do you ever avoid playing certain music because you're worried it will affect your recommendations?",
      "How do you handle kids' music, party playlists, or one-off genres in your account?",
      "Would a 'don't learn from this session' mode change how you explore?",
    ],
  },
  {
    hypothesis: "Context-aware surfaces increase discovery",
    questions: [
      "What context (time, place, activity) most changes what you want to hear?",
      "Does your Spotify home screen match what you want right now or what you usually play?",
      "When does Discover Weekly work well vs fall flat for you?",
    ],
  },
];

export const SOLUTION_DIRECTIONS = [
  "Direction 1 — Intent-Aware Recommendations (recommended MVP): Session-scoped intent layer that separates temporary context from long-term taste.",
  "Direction 2 — AI Discovery Search: Natural-language search for mood, scene, and activity when users cannot name artists.",
  "Direction 3 — Recommendation Memory Controls: Guest/ephemeral sessions so exploration does not permanently reshape taste.",
];

export const NEXT_STEPS = [
  "Conduct 8–12 user interviews using the interview guide below to validate Hypotheses 1–3.",
  "Prototype intent capture at session start (mood, activity, novelty preference) with 5–8 users.",
  "Quantify repetitive-listening complaints vs Premium monetization complaints to confirm Growth focus.",
  "Synthesize interview findings into a single problem statement for Part 2 of the assignment.",
];

export function reviewBlob(r: NormalizedReview): string {
  return `${r.title || ""} ${r.body || ""}`.toLowerCase();
}

export function matchReviews(reviews: NormalizedReview[], terms: string[]): NormalizedReview[] {
  return reviews.filter((r) => terms.some((t) => reviewBlob(r).includes(t)));
}

export function quoteSnippet(r: NormalizedReview, max = 260): string {
  const text = (r.body || r.title || "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function evidenceConfidence(count: number, total: number) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const value = Math.min(0.92, 0.4 + (count / Math.max(total, 1)) * 1.75);
  return {
    value,
    rationale: `Derived from ${count.toLocaleString()} reviews (${pct}% of discovery dataset). Confidence scales with mention density across sources.`,
  };
}

export function rankGrowthPatterns(reviews: NormalizedReview[]) {
  return GROWTH_PATTERNS.map((p) => {
    const matched = matchReviews(reviews, p.terms);
    const score = matched.length * p.growthPriority;
    return { pattern: p, matched, count: matched.length, score };
  })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.score - a.score);
}

export function assignPersonas(reviews: NormalizedReview[], total: number) {
  return PERSONA_DEFS.map((p) => {
    const matched = matchReviews(reviews, p.terms);
    return {
      name: p.name,
      description: p.description,
      goals: p.goals,
      painPoints: p.painPoints,
      discoveryBarriers: p.discoveryBarriers,
      opportunities: p.opportunities,
      estimatedShare: total > 0 ? Math.min(0.45, matched.length / total) : 0,
      _count: matched.length,
    };
  })
    .filter((p) => p._count > 0)
    .sort((a, b) => b._count - a._count)
    .map(({ _count: _, ...rest }) => rest);
}

export function segmentsForPattern(patternId: string, reviews: NormalizedReview[]): string[] {
  const ranked = PERSONA_DEFS.map((p) => ({
    name: p.name,
    count: matchReviews(reviews, p.terms).length,
  }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);

  const byPattern: Record<string, string[]> = {
    bad_recs: ["Algorithm Skeptic", "Explorer", "Mood Listener"],
    repetitive: ["Comfort Listener", "Explorer", "Algorithm Skeptic"],
    home_feed: ["Routine Listener", "Explorer", "Mood Listener"],
    explore: ["Explorer", "Social Curator", "Mood Listener"],
    genre_mood: ["Mood Listener", "Routine Listener", "Explorer"],
    shuffle_limits: ["Free-tier Explorer"],
  };

  const preferred = byPattern[patternId] ?? [];
  const names = ranked.map((r) => r.name);
  return [...new Set([...preferred.filter((n) => names.includes(n)), ...names])].slice(0, 3);
}

const QUESTION_WHY: Record<string, (count: number, pct: number, topPattern?: GrowthPattern) => string> = {
  d1: (c, p, t) =>
    `Users struggle to discover new music because recommendation surfaces optimize for familiarity over novelty. ${c} reviews (${p}%) describe discovery friction — not lack of catalog, but lack of trustworthy pathways.${t ? ` Strongest signal: ${t.label.toLowerCase()}.` : ""}`,
  d2: (c, p, t) =>
    `Barriers are cognitive and algorithmic: users cannot express intent, and the system cannot separate temporary context from long-term taste. ${c} reviews (${p}%) cite limits, mistrust, or stale surfaces.${t ? ` Leading barrier: ${t.label.toLowerCase()}.` : ""}`,
  d3: (c, p, t) =>
    `Repetitive listening is driven by engagement-optimized ranking, not stated preference. ${c} reviews (${p}%) link repeat playback to recommendation loops and weak novelty control.${t ? ` Primary driver: ${t.label.toLowerCase()}.` : ""}`,
  d4: (c, p, t) =>
    `Recommendation frustration centers on misalignment — wrong mood, wrong moment, wrong genre. ${c} reviews (${p}%) express distrust in the algorithm's understanding of current intent.${t ? ` Most cited: ${t.label.toLowerCase()}.` : ""}`,
  d5: (c, p, t) =>
    `Discover Weekly and similar features are trust benchmarks. ${c} reviews (${p}%) compare flagship discovery products; negative sentiment often generalizes to the whole system.${t ? ` Feature signal: ${t.label.toLowerCase()}.` : ""}`,
  d6: (c, p, t) =>
    `Unmet needs cluster around intent expression, novelty control, and discovery search. ${c} reviews (${p}%) use wish/need language tied to discovery — not billing or crashes.${t ? ` Top unmet need: ${t.growthOpportunity.toLowerCase()}.` : ""}`,
  b1: (c, p, t) =>
    `Reviews reveal distinct listening modes: background/focus sessions, mood-driven picks, comfort replay, and active exploration. ${c} reviews (${p}%) describe how people actually use Spotify day-to-day.${t ? ` Dominant behaviour cluster: ${t.label.toLowerCase()}.` : ""}`,
  b2: (c, p, t) =>
    `When opening Spotify, users hire the product to match a moment — study focus, workout energy, social vibe, or deliberate discovery — not just replay history. ${c} reviews (${p}%) frame goals in intent language.${t ? ` Most common job: ${t.symptom.toLowerCase()}` : ""}`,
  b3: (c, p, t) =>
    `Exploration vs familiarity is situational: users seek new music in exploratory moods but revert to favorites when tired, commuting, or multitasking. ${c} reviews (${p}%) contrast "something new" with "same songs again".${t ? ` Split signal: ${t.label.toLowerCase()}.` : ""}`,
  b4: (c, p, t) =>
    `Exploratory listening is triggered by social shares, flagship playlists (Discover Weekly), genre curiosity, and life-context changes — not the home feed alone. ${c} reviews (${p}%) describe what prompted them to branch out.${t ? ` Top trigger: ${t.label.toLowerCase()}.` : ""}`,
  b5: (c, p, t) =>
    `Repetitive listening is triggered by algorithm loops, stale home surfaces, comfort habits, and engagement-optimized ranking — not explicit user choice. ${c} reviews (${p}%) tie repeat playback to system behaviour.${t ? ` Primary loop: ${t.label.toLowerCase()}.` : ""}`,
  b6: (c, p, t) =>
    `Context (study, gym, commute, sleep, party) strongly shapes whether users want discovery or familiarity. ${c} reviews (${p}%) link listening context to recommendation fit.${t ? ` Context theme: ${t.label.toLowerCase()}.` : ""}`,
  s1: (c, p, t) =>
    `Natural segments include Explorers, Comfort Listeners, Mood-driven users, Algorithm Skeptics, and Free-tier constrained listeners. ${c} reviews (${p}%) map to identifiable personas with different discovery needs.${t ? ` Strongest segment signal: ${t.label.toLowerCase()}.` : ""}`,
  s2: (c, p, t) =>
    `Explorers and Algorithm Skeptics struggle most — they want novelty but report broken or stale recommendation pathways. ${c} reviews (${p}%) from high-intent discovery users express the sharpest friction.${t ? ` Segment pain: ${t.label.toLowerCase()}.` : ""}`,
  s3: (c, p, t) =>
    `Unmet needs concentrate among users who think in moods and contexts, not artist names — they want intent-aware discovery. ${c} reviews (${p}%) use wish/need language for features Spotify lacks.${t ? ` Unmet need: ${t.growthOpportunity.toLowerCase()}.` : ""}`,
  s4: (c, p, t) =>
    `Free-tier users face shuffle and skip limits that block intentional exploration; Premium users complain about algorithm quality, not paywalls. ${c} reviews (${p}%) show divergent discovery constraints by tier.${t ? ` Tier split: ${t.label.toLowerCase()}.` : ""}`,
  s5: (c, p, t) =>
    `Users stop exploring when recommendations feel repetitive, irrelevant, or untrustworthy — they disengage from algorithmic surfaces. ${c} reviews (${p}%) link exploration drop-off to recommendation fatigue.${t ? ` Churn signal: ${t.label.toLowerCase()}.` : ""}`,
  j1: (c, p, t) =>
    `Fundamentally users want the right music for the right moment — discovery, comfort, focus, or social sharing — without fighting the product. ${c} reviews (${p}%) describe outcome-oriented jobs, not feature requests.${t ? ` Core job: ${t.symptom.toLowerCase()}` : ""}`,
  j2: (c, p, t) =>
    `Discovery JTBD cluster around finding new artists, breaking filter bubbles, matching mood/context, and regaining trust in recommendations. ${c} reviews (${p}%) frame discovery as a job-to-be-done.${t ? ` Top JTBD: ${t.label.toLowerCase()}.` : ""}`,
  j3: (c, p, t) =>
    `Underserved jobs include mood-native search, session-scoped recommendations, and exploration without permanently altering taste profiles. ${c} reviews (${p}%) describe jobs Spotify partially fails today.${t ? ` Gap: ${t.growthOpportunity.toLowerCase()}.` : ""}`,
  p1: (c, p, t) =>
    `Discovery pain points are algorithmic misalignment, stale feeds, repetitive loops, and inability to express intent — not missing catalog. ${c} reviews (${p}%) block successful discovery.${t ? ` Top blocker: ${t.label.toLowerCase()}.` : ""}`,
  p2: (c, p, t) =>
    `Highest frustration comes from feeling the algorithm "doesn't know me" after repeated wrong recommendations. ${c} reviews (${p}%) use strong negative language about trust breakdown.${t ? ` Frustration theme: ${t.label.toLowerCase()}.` : ""}`,
  r1: (c, p, t) =>
    `Root causes are systemic: historical engagement signals overpower session intent. ${c} reviews (${p}%) connect complaints to algorithm behaviour and missing context.${t ? ` Underlying cause: ${t.aiInterpretation.split(".")[0]}.` : ""}`,
  r2: (c, p, t) =>
    `Trust erodes after repeated mismatches — users shift to manual search or abandon algorithmic surfaces. ${c} reviews (${p}%) describe broken or useless recommendations.${t ? ` Trust break: ${t.label.toLowerCase()}.` : ""}`,
  r3: (c, p, t) =>
    `Exploration stops when novelty feels risky (permanent taste pollution) or when recommendations keep replaying the same pool. ${c} reviews (${p}%) explain why users give up on discovering.${t ? ` Driver: ${t.label.toLowerCase()}.` : ""}`,
  r4: (c, p, t) =>
    `Shuffle limits and UI friction are symptoms; the underlying cause is weak intent modelling and engagement-optimized ranking. ${c} reviews (${p}%) mix surface complaints with deeper algorithm issues.${t ? ` Symptom vs cause: ${t.label.toLowerCase()}.` : ""}`,
  r5: (c, p, t) =>
    `Most high-impact issues are algorithmic (intent, novelty, trust) rather than pure UX polish — though opaque controls amplify distrust. ${c} reviews (${p}%) attribute problems to the recommender.${t ? ` Algorithmic share: ${t.label.toLowerCase()}.` : ""}`,
  o1: (c, p, t) =>
    `Consistent unmet needs: intent-aware recs, novelty controls, mood search, and ephemeral listening modes. ${c} reviews (${p}%) repeat the same opportunity themes.${t ? ` Opportunity: ${t.growthOpportunity.toLowerCase()}.` : ""}`,
  o2: (c, p, t) =>
    `Growth-aligned opportunities focus on meaningful discovery depth — not monetization mechanics alone. ${c} reviews (${p}%) tie product gaps to exploratory engagement.${t ? ` Growth lever: ${t.growthOpportunity.toLowerCase()}.` : ""}`,
  o3: (c, p, t) =>
    `AI uniquely enables mood/scene search, session intent inference, and explain-why recommendations where collaborative filtering fails. ${c} reviews (${p}%) imply AI-native solutions.${t ? ` AI wedge: ${t.growthOpportunity.toLowerCase()}.` : ""}`,
  o4: (c, p, t) =>
    `Meaningful discovery improves when users get trustworthy novelty without losing comfort listening. ${c} reviews (${p}%) prioritize discovery quality over catalog size.${t ? ` Impact area: ${t.label.toLowerCase()}.` : ""}`,
  o5: (c, p, t) =>
    `Cross-platform comparisons (Apple Music, YouTube Music) appear when Spotify discovery feels stale — users benchmark alternative discovery experiences. ${c} reviews (${p}%) reference competitors in discovery context.${t ? ` Competitive signal: ${t.label.toLowerCase()}.` : ""}`,
  bi1: (c, p, t) =>
    `Engagement drops when discovery surfaces feel stale or repetitive — users describe boredom and reduced exploratory sessions. ${c} reviews (${p}%) link discovery failure to disengagement.${t ? ` Engagement risk: ${t.label.toLowerCase()}.` : ""}`,
  bi2: (c, p, t) =>
    `Repetitive listening increases when novelty controls are absent and the algorithm optimizes for familiar engagement. ${c} reviews (${p}%) describe reinforcement loops.${t ? ` Loop driver: ${t.label.toLowerCase()}.` : ""}`,
  bi3: (c, p, t) =>
    `Retention risk concentrates among Algorithm Skeptics and Explorers who lose trust in recommendations. ${c} reviews (${p}%) mention canceling, deleting, or switching apps.${t ? ` Retention threat: ${t.label.toLowerCase()}.` : ""}`,
  bi4: (c, p) =>
    `Highest-impact Growth opportunities are intent-aware recommendations and AI discovery search — not queue or shuffle mechanics. ${c} reviews (${p}%) tie discovery quality to continued engagement.`,
  bi5: (c, p, t) =>
    `Growth Team should prioritize intent modelling, novelty controls, and discovery search over playback mechanics. ${c} reviews (${p}%) rank recommendation quality above minor UX fixes.${t ? ` Priority theme: ${t.label.toLowerCase()}.` : ""}`,
};

export function buildInsightFinding(
  questionId: string,
  question: string,
  count: number,
  total: number,
  topPattern?: GrowthPattern,
): string {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const custom = QUESTION_WHY[questionId];
  if (custom) return custom(count, pct, topPattern);
  return `Across ${count} reviews (${pct}% of the discovery dataset), users describe patterns consistent with "${question.replace(/\?$/, "").toLowerCase()}".${topPattern ? ` Primary theme: ${topPattern.label.toLowerCase()}.` : ""}`;
}

export function businessImpactDescription(impact: "low" | "medium" | "high", count: number): string {
  const map = {
    high: "Reduced meaningful discovery and exploratory sessions; risk of habituation and churn among high-intent listeners.",
    medium: "Moderate drag on discovery depth; affects specific segments more than core Premium engagement.",
    low: "Localized friction; unlikely to move the Growth discovery metric on its own.",
  };
  return `${map[impact]} Supported by ${count.toLocaleString()} review mentions.`;
}
