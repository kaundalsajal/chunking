import { Pool } from "postgres-pool";

import { config } from "dotenv";
import { generateEmbedding } from "./src/embeddings/gemini.js";
config();
// Uses DATABASE_URL environment variable by default
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export async function searchSimilarChunks(
  queryEmbedding: number[],
  limit = 10,
) {
  const vector = `[${queryEmbedding.join(",")}]`;

  const result = await pool.query(
    `
    SELECT
      id,
      content,
      embedding <=> $1::vector AS distance
    FROM document_embeddings
    ORDER BY embedding <=> $1::vector
    LIMIT $2
    `,
    [vector, limit],
  );

  return result.rows;
}
const query = "tell me about the page router in next js?";

const embedding = await generateEmbedding(query);

const results = await searchSimilarChunks(embedding, 10);

console.log(results);
