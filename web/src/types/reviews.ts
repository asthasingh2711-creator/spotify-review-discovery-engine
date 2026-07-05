export type SentimentLabel = "positive" | "neutral" | "negative";

export type ReviewSource =
  | "App Store"
  | "Play Store"
  | "Reddit"
  | "Spotify Community"
  | "Social Media"
  | "Unknown";

export type ReviewType = "review" | "discussion" | "comment" | "post" | "unknown";

export type NormalizedReview = {
  id: string;
  source: ReviewSource;
  platform?: string;
  type: ReviewType;
  title: string;
  body: string;
  rating?: number;
  date?: string; // ISO when available
  url?: string;
  author?: string;
  raw?: unknown;
};

export type UploadedDataset = {
  meta?: Record<string, unknown>;
  reviews: NormalizedReview[];
};

