import Cerebras from "@cerebras/cerebras_cloud_sdk";

export function getCerebrasClient() {
  const apiKey = process.env.CEREBRAS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing CEREBRAS_API_KEY environment variable.");
  }
  return new Cerebras({ apiKey });
}

export function getCerebrasModel() {
  return process.env.CEREBRAS_MODEL || "gemma-4-31b";
}
