import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  // Use the recommended text embedding model
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
  const result = await model.embedContent(text);
  const embedding = result.embedding.values;
  
  return embedding;
}

// A simple utility to wait, useful for rate limiting
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
