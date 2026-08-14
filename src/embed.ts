import fs from "node:fs";
import path from "node:path";
import { initDb, insertChunk, closeDb } from "./db/index.js";
import { generateEmbedding, sleep } from "./embeddings/gemini.js";
import type { FinalChunk } from "./types/index.js";
import { getAllFiles } from "./utils/file-system.js";

const OUTPUT_DIR = "./output";
// The free tier of Gemini has strict rate limits. 
// For production scale you'll want to implement proper exponential backoff
// Here we do a simple pause between chunks.
const DELAY_BETWEEN_REQUESTS_MS = 1000;

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Please set GEMINI_API_KEY environment variable.");
    process.exit(1);
  }
  
  if (!process.env.DATABASE_URL) {
    console.error("Please set DATABASE_URL environment variable.");
    process.exit(1);
  }

  console.log("Initializing database schema...");
  try {
    await initDb();
  } catch (dbError) {
    console.error("Failed to connect to or initialize database:", dbError);
    process.exit(1);
  }

  const chunkFiles = getAllFiles(OUTPUT_DIR).filter(f => f.endsWith(".json"));
  console.log(`Found ${chunkFiles.length} JSON chunk files to process.`);

  let totalChunksProcessed = 0;
  
  for (const file of chunkFiles) {
    console.log(`Processing embeddings for file: ${file}`);
    const data = fs.readFileSync(file, "utf-8");
    const chunks: FinalChunk[] = JSON.parse(data);
    
    for (const chunk of chunks) {
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk.content);
        
        // Save to postgres
        await insertChunk(chunk, embedding);
        
        totalChunksProcessed++;
        process.stdout.write(`.`); // progress indicator
        
        // Wait to avoid hitting rate limits on the free tier
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      } catch (error) {
        console.error(`\nError processing chunk from ${chunk.sourceFile}:`, error);
        // If it's a rate limit error, you might want to wait longer and retry
      }
    }
    console.log(""); // newline after each file
  }

  console.log(`\nFinished processing embeddings! Total chunks stored: ${totalChunksProcessed}`);
  await closeDb();
}

main().catch(console.error);
