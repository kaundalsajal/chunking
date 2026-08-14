import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { getAST } from "./ast-parser.js";
import { extractSections } from "./extractors/section-extractor.js";
import { chunkSection } from "./chunkers/overlap-chunker.js";
import { getAllFiles, saveChunks } from "./utils/file-system.js";
import type { DocumentData, FinalChunk } from "./types/index.js";

const DOCS_DIR = "./docs";
const OUTPUT_DIR = "./output";
const MAX_CHUNK_SIZE = 1000; // Adjust as needed
const OVERLAP_SIZE = 200;    // Adjust as needed

async function main() {
  console.log(`Starting chunking process for directory: ${DOCS_DIR}`);
  
  const files = getAllFiles(DOCS_DIR);
  console.log(`Found ${files.length} MD/MDX files.`);

  for (const file of files) {
    console.log(`Processing: ${file}`);
    
    try {
      const data = fs.readFileSync(file, "utf-8");
      const parsedText = matter(data);
      
      const ast = getAST(parsedText.content);
      const sections = extractSections(ast);
      
      const documentData: DocumentData = {
        title: parsedText.data.title || path.basename(file),
        description: parsedText.data.description || "",
        sourceFile: file,
        sections
      };
      
      let documentChunks: FinalChunk[] = [];
      
      for (const section of documentData.sections) {
        const chunks = chunkSection(documentData, section, MAX_CHUNK_SIZE, OVERLAP_SIZE);
        documentChunks = documentChunks.concat(chunks);
      }
      
      saveChunks(documentChunks, file, OUTPUT_DIR);
      
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  
  console.log("Chunking process complete.");
}

main();
