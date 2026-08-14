import fs from "node:fs";
import path from "node:path";
import type { FinalChunk } from "../types/index.js";

// Recursively get all .md and .mdx files
export function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith(".json")) {
        // if (file.endsWith(".md") || file.endsWith(".mdx"))
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

export function saveChunks(chunks: FinalChunk[], sourceFile: string, outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseName = path.basename(sourceFile);
  const nameWithoutExt = baseName.replace(/\.(md|mdx)$/, "");
  
  // The user requested the file name be in accordance with the data it contains.
  // We will use the base name (which is typically kebab-case already like '01-installation')
  const outPath = path.join(outputDir, `${nameWithoutExt}.json`);
  
  fs.writeFileSync(outPath, JSON.stringify(chunks, null, 2), "utf-8");
  console.log(`Saved ${chunks.length} chunks to ${outPath}`);
}
