import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

export function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  return new GoogleGenerativeAI(apiKey);
}
