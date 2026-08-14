import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";

config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  const embedding = result.embeddings?.[0]?.values;

  if (!embedding) {
    throw new Error("Failed to generate embedding.");
  }

  return embedding;
}

// A simple utility to wait, useful for rate limiting
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
