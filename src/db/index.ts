import { Pool } from "pg";
import type { FinalChunk } from "../types/index.js";

// Uses DATABASE_URL environment variable by default
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    // Ensure the pgvector extension exists
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // Create the standard document embeddings table
    // Using 768 dimensions as that is the standard for text-embedding-004
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id SERIAL PRIMARY KEY,
        document_title TEXT NOT NULL,
        section_title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        source_file TEXT,
        embedding vector(768)
      );
    `);
    console.log("Database schema initialized successfully.");
  } finally {
    client.release();
  }
}

export async function insertChunk(chunk: FinalChunk, embedding: number[]) {
  const query = `
    INSERT INTO document_embeddings (document_title, section_title, content, metadata, source_file, embedding)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  
  // Format the vector array as a string representation for Postgres pgvector
  const vectorString = `[${embedding.join(",")}]`;
  
  const values = [
    chunk.documentTitle,
    chunk.sectionTitle,
    chunk.content,
    chunk.metadata,
    chunk.sourceFile,
    vectorString
  ];

  await pool.query(query, values);
}

export async function closeDb() {
  await pool.end();
}
