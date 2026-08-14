import type { FinalChunk, SectionChunk, ChunkBlock, ChunkMetadata, DocumentData } from "../types/index.js";

// A simple recursive character text splitter concept adapted for our blocks
export function chunkSection(
  document: DocumentData, 
  section: SectionChunk, 
  maxChunkSize: number = 1000, 
  overlapSize: number = 200
): FinalChunk[] {
  const finalChunks: FinalChunk[] = [];
  
  let currentChunkText = "";
  let currentMetadata: ChunkMetadata = {};
  
  // We'll collect blocks until we hit maxChunkSize. 
  // If a block pushes us over, we split.
  
  // To handle overlap, we'll keep a buffer of recent blocks/text.
  // For simplicity in this implementation, we will build a full string of the section
  // and then apply a sliding window, while attempting to retain the combined metadata.
  
  // Aggregate all text and metadata for the section
  let fullText = "";
  const aggregatedMetadata: ChunkMetadata = {};
  
  for (const block of section.blocks) {
    if (block.metadata) {
      Object.assign(aggregatedMetadata, block.metadata);
    }
    
    // We add a newline between blocks
    fullText += block.content + "\n\n";
  }
  
  fullText = fullText.trim();

  // If the entire section is small enough, it's just one chunk.
  if (fullText.length <= maxChunkSize) {
    return [{
      documentTitle: document.title,
      documentDescription: document.description,
      sectionTitle: section.title,
      content: fullText,
      metadata: aggregatedMetadata,
      sourceFile: document.sourceFile
    }];
  }

  // Otherwise, we do an overlapping split on the text
  let startIndex = 0;
  while (startIndex < fullText.length) {
    let endIndex = startIndex + maxChunkSize;
    
    // Adjust end index to not cut in the middle of a word/sentence if possible
    // We try to find a newline or space near the limit
    if (endIndex < fullText.length) {
      const nextNewline = fullText.lastIndexOf("\n", endIndex);
      const nextSpace = fullText.lastIndexOf(" ", endIndex);
      
      if (nextNewline > startIndex) {
        endIndex = nextNewline;
      } else if (nextSpace > startIndex) {
        endIndex = nextSpace;
      }
    } else {
      endIndex = fullText.length;
    }
    
    const chunkContent = fullText.substring(startIndex, endIndex).trim();
    
    if (chunkContent.length > 0) {
      finalChunks.push({
        documentTitle: document.title,
        documentDescription: document.description,
        sectionTitle: section.title,
        content: chunkContent,
        metadata: aggregatedMetadata, // We assign section-level metadata to all its chunks
        sourceFile: document.sourceFile
      });
    }
    
    const oldStartIndex = startIndex;
    startIndex = endIndex - overlapSize;
    
    // Prevent infinite loop if we aren't advancing
    if (startIndex <= oldStartIndex) {
      startIndex = oldStartIndex + 1;
    }
    
    if (endIndex >= fullText.length) {
       break;
    }
  }

  return finalChunks;
}
