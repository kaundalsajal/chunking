import { Pool } from "postgres-pool";
import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { generateEmbedding } from "./src/embeddings/gemini.js";

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

interface RetrievedChunk {
  id: number;
  document_title: string;
  section_title: string;
  content: string;
  metadata: Record<string, unknown>;
  source_file: string;
  distance: number;
}

/**
 * Search PostgreSQL using pgvector
 */
async function searchSimilarChunks(
  queryEmbedding: number[],
  limit = 10,
): Promise<RetrievedChunk[]> {
  const vector = `[${queryEmbedding.join(",")}]`;

  const result = await pool.query(
    `
    SELECT
      id,
      document_title,
      section_title,
      content,
      metadata,
      source_file,
      embedding <=> $1 AS distance
    FROM document_embeddings
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1
    LIMIT $2;
    `,
    [vector, limit],
  );

  return result.rows;
}

/**
 * Ask Gemini to evaluate the retrieved chunks.
 */
async function evaluateChunks(question: string, chunks: RetrievedChunk[]) {
  const chunksForEvaluation = chunks.map((chunk, index) => ({
    rank: index + 1,
    id: chunk.id,
    document_title: chunk.document_title,
    section_title: chunk.section_title,
    content: chunk.content,
    source_file: chunk.source_file,
    distance: chunk.distance,
  }));

  const prompt = `
You are evaluating a vector retrieval system for a Next.js documentation RAG.

USER QUESTION:
${question}

RETRIEVED CHUNKS:
${JSON.stringify(chunksForEvaluation, null, 2)}

Evaluate ONLY the retrieval quality.

For every retrieved chunk:

- Give a relevance score from 0 to 10.
- Explain why it is relevant or irrelevant.
- Classify it as one of:
  "highly_relevant"
  "relevant"
  "weakly_relevant"
  "irrelevant"

Then calculate an overall retrieval score from 0 to 10.

Consider these factors:

1. Does the chunk directly help answer the user's question?
2. Is it about the correct Next.js concept?
3. Is it specific enough to be useful?
4. Is the chunk from a related but different concept?
5. Are irrelevant chunks appearing too high in the ranking?

Use the ranking and distance as additional information, but judge relevance primarily from the actual content.

Return ONLY valid JSON.

Required format:

{
  "question": "...",
  "overall_score": 0,
  "quality": "good",
  "summary": "...",
  "chunks": [
    {
      "rank": 1,
      "id": 123,
      "score": 10,
      "classification": "highly_relevant",
      "reason": "..."
    }
  ],
  "recommendations": [
    "..."
  ]
}

The quality must be one of:

- "excellent"
- "good"
- "acceptable"
- "poor"
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response");
  }

  return JSON.parse(response.text);
}

/**
 * Test questions
 */
const testQuestions = [
  "How do I create a page?",
  // "How do I create a dynamic route?",
  // "How do layouts work in Next.js?",
  // "How do I create an API route?",
  // "How does the App Router work?",
  // "How does the Pages Router work?",
  // "How do I fetch data in a Server Component?",
  // "How do I use middleware in Next.js?",
  // "How do I generate static parameters?",
  // "How does caching work in Next.js?",
  // "How do I redirect a user in Next.js?",
  // "How do I create a loading UI?",
  // "How do error boundaries work in Next.js?",
  // "How do I use environment variables?",
  // "How do I configure next.config.js?",
];

/**
 * Test one question
 */
async function testQuestion(question: string) {
  console.log("\n");
  console.log("==================================================");
  console.log(`QUESTION: ${question}`);
  console.log("==================================================");

  // Generate embedding for the question
  const embedding = await generateEmbedding(question);

  console.log(`Query embedding dimensions: ${embedding.length}`);

  // Search PostgreSQL
  const results = await searchSimilarChunks(embedding, 10);

  console.log(`Retrieved ${results.length} chunks`);

  // Print ranking
  console.log("\nTop retrieved chunks:");

  results.forEach((chunk, index) => {
    console.log(
      `${index + 1}. ${chunk.document_title} → ${chunk.section_title} | distance: ${chunk.distance}`,
    );
  });

  // Ask Gemini to evaluate them
  console.log("\nAnalyzing retrieval quality with Gemini...");

  const evaluation = await evaluateChunks(question, results);

  console.log("\nGemini evaluation:");

  console.log(JSON.stringify(evaluation, null, 2));

  return evaluation;
}

/**
 * Run all tests
 */
async function runTests() {
  const evaluations = [];

  for (const question of testQuestions) {
    try {
      const evaluation = await testQuestion(question);

      evaluations.push(evaluation);

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to test question: ${question}`);

      console.error(error);
    }
  }

  console.log("\n\n");
  console.log("==================================================");
  console.log("FINAL RETRIEVAL REPORT");
  console.log("==================================================");

  for (const evaluation of evaluations) {
    console.log(`\n${evaluation.question}`);

    console.log(`Score: ${evaluation.overall_score}/10`);

    console.log(`Quality: ${evaluation.quality}`);

    console.log(`Summary: ${evaluation.summary}`);
  }

  if (evaluations.length > 0) {
    const average =
      evaluations.reduce(
        (sum, evaluation) => sum + evaluation.overall_score,
        0,
      ) / evaluations.length;

    console.log("\n");
    console.log(`AVERAGE RETRIEVAL SCORE: ${average.toFixed(2)}/10`);
  }
}

try {
  await runTests();
} finally {
  await pool.end();
}
