export const REPORT_PROMPT = `You will be given a batch of normalized Spotify reviews/discussions.

Your job: extract structured product insights for a Product Manager.

Return JSON matching this shape:
{
  "sentiment": { "positive": number, "neutral": number, "negative": number }, // percentages (0-100) summing to 100
  "themes": [
    {
      "theme": string,
      "description": string,
      "frequency": number, // count in THIS batch
      "representativeQuotes": [{ "quote": string, "source": string?, "date": string?, "url": string? }]
    }
  ],
  "jtbds": [{ "job": string, "frequency": number, "examples": string[] }],
  "painPoints": [{ "painPoint": string, "frequency": number, "representativeQuotes": string[] }],
  "rootCauses": [{ "complaint": string, "inferredRootCause": string, "evidenceQuotes": string[], "confidence": number }],
  "segments": [{ "segment": string, "description": string, "estimatedShare": number, "keyThemes": string[], "representativeQuotes": string[] }],
  "opportunities": [{ "opportunity": string, "evidence": string[], "affectedSegments": string[], "businessImpact": "low"|"medium"|"high", "confidence": number, "priority": "p0"|"p1"|"p2" }],
  "summary": { "topProblems": string[], "topOpportunities": string[], "biggestRisks": string[], "keyInsights": string[] }
}

Instructions:
- Dynamically create themes (don't force predefined labels), but keep them readable and PM-friendly.
- Prefer fewer, stronger themes over many weak ones.
- Use quotes that are verbatim from the batch.
- Root causes must go beyond restating the complaint.
- Segments should be inferred from language (free vs premium, power user, podcast vs music, playlist creators, etc).
`;

