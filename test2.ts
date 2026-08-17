import { Pool } from "postgres-pool";
import { config } from "dotenv";
import { generateEmbedding } from "./src/embeddings/gemini.js";

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

async function searchSimilarChunks(queryEmbedding: number[], limit = 10) {
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
    ORDER BY embedding <=> $1
    LIMIT $2;
    `,
    [vector, limit],
  );

  return result.rows;
}

const question = "How do I create a page?";

try {
  // Generate embedding for the question
  const queryEmbedding = await generateEmbedding(question);

  // Retrieve the most similar chunks from PostgreSQL
  const results = await searchSimilarChunks(queryEmbedding, 10);

  console.log("\nQUESTION:");
  console.log(question);

  console.log("\nRETRIEVED CHUNKS:");
  console.log("========================================");

  results.forEach((chunk, index) => {
    console.log(`\nRANK: ${index + 1}`);
    console.log(`ID: ${chunk.id}`);
    console.log(`Distance: ${chunk.distance}`);
    console.log(`Document: ${chunk.document_title}`);
    console.log(`Section: ${chunk.section_title}`);
    console.log(`Source: ${chunk.source_file}`);
    console.log(`Metadata:`, chunk.metadata);

    console.log("\nCONTENT:");
    console.log(chunk.content);

    console.log("----------------------------------------");
  });
} catch (error) {
  console.error("Search failed:", error);
} finally {
  await pool.end();
}
