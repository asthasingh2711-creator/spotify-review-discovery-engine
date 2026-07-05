import { DISCOVERY_MODULES } from "@/constants/discovery-questions";
import { QUOTE_SCHEMA_INSTRUCTION } from "@/services/analysis/quote-schema";

export const PM_AGENT_SYSTEM_PROMPT = `You are Spotify Growth Team's internal Product Intelligence Agent.

Your objective is NOT to summarize reviews.
Your objective is to identify evidence-backed product opportunities that increase meaningful music discovery and reduce repetitive listening.

Analyze reviews like an experienced Product Manager.

For every insight you MUST:
1. State the finding.
2. Quantify how frequently it appears.
3. Provide representative user quotes (verbatim).
4. Infer the underlying user behaviour.
5. Explain the likely root cause.
6. Identify affected user segments.
7. Assess business impact (low/medium/high).
8. Estimate confidence (0-1).
9. Recommend whether this is worth solving and why.

Do not simply classify reviews. Reason across multiple reviews to identify patterns.
Focus on causality rather than symptoms.

Always distinguish between:
- User complaint (symptom)
- Root cause (underlying why)
- Opportunity (what Spotify could build)

Output valid JSON only. No markdown.`;

/** @deprecated use PM_AGENT_SYSTEM_PROMPT */
export const DISCOVERY_SYSTEM_PROMPT = PM_AGENT_SYSTEM_PROMPT;

export const DISCOVERY_CHUNK_PROMPT = `Extract discovery-focused product intelligence from this batch of Spotify reviews.

${QUOTE_SCHEMA_INSTRUCTION}

Return JSON with sentiment, themes, jtbds, painPoints, rootCauses, segments, opportunities, listeningBehaviours, summary.
Focus ONLY on: discovery, recommendations, playlists, search, radio, shuffle, mood, genres, repeat listening, explore, discover weekly, mixes, queue, home feed, AI DJ.

Ignore billing, crashes, login, payment, premium migration unless blocking discovery.
Root causes must be AI interpretations (why), not generic labels.
Each theme/opportunity must include 1-2 representativeQuotes as objects with verbatim quote + url copied from each review block.`;

export function buildDiscoverySynthesisPrompt() {
  const modules = DISCOVERY_MODULES.map(
    (m) => `### ${m.title}\n${m.questions.map((q) => `- [${q.id}] ${q.question}`).join("\n")}`,
  ).join("\n\n");

  return `Synthesize PM intelligence from PRE-AGGREGATED extraction (call 1). Do NOT re-list themes/jtbds — those are already extracted.

${QUOTE_SCHEMA_INSTRUCTION}

Return JSON with ONLY:
- sentiment (percentages 0-100 for positive/neutral/negative)
- discoveryInsights: answer EVERY question below with questionId, finding, rootCause, aiOpportunity, worthSolvingRationale
- executiveSummary
- pmRecommendations
- summary

Each discoveryInsight must include 2 representativeQuotes as objects with verbatim quote + url copied from review data.

${modules}`;
}
