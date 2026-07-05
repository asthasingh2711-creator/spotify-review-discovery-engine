/** Strict quote object — LLM must copy url/source from review blocks in the prompt. */
export const QUOTE_OBJECT_SCHEMA = {
  type: "object",
  properties: {
    quote: { type: "string", description: "Verbatim user quote from the review body" },
    source: { type: "string", description: "Play Store, App Store, Reddit, or Spotify Community" },
    url: { type: "string", description: "Review url from the review block, or empty string" },
    author: { type: "string", description: "Author from review block, or empty string" },
    date: { type: "string", description: "ISO date from review block, or empty string" },
  },
  required: ["quote", "source", "url", "author", "date"],
  additionalProperties: false,
} as const;

export const QUOTE_OBJECT_ARRAY = {
  type: "array",
  items: QUOTE_OBJECT_SCHEMA,
} as const;

export const QUOTE_SCHEMA_INSTRUCTION = `Every representativeQuotes / evidence / examples entry MUST be an object:
{ "quote": "<verbatim from review body>", "source": "<from review>", "url": "<url line from review>", "author": "<author or \"\">", "date": "<date or \"\">" }
Never use plain strings for quotes. Copy url exactly from the review text.`;
