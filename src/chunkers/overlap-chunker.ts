import type {
  FinalChunk,
  SectionChunk,
  ChunkMetadata,
  DocumentData,
} from "../types/index.js";

function findSafeSplitIndex(
  text: string,
  preferredEnd: number,
  minChunkLength: number,
): number {
  if (preferredEnd >= text.length) {
    return text.length;
  }

  const latestBreak = Math.max(
    text.lastIndexOf("\n", preferredEnd),
    text.lastIndexOf(" ", preferredEnd),
    text.lastIndexOf(".", preferredEnd),
  );

  if (latestBreak > minChunkLength && latestBreak > 0) {
    return latestBreak;
  }

  return preferredEnd;
}

// A simple recursive character text splitter concept adapted for our blocks
export function chunkSection(
  document: DocumentData,
  section: SectionChunk,
  maxChunkSize: number = 1000,
  overlapSize: number = 200,
): FinalChunk[] {
  const finalChunks: FinalChunk[] = [];

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

  if (!fullText) {
    return [];
  }

  // If the entire section is small enough, it's just one chunk.
  if (fullText.length <= maxChunkSize) {
    return [
      {
        documentTitle: document.title,
        documentDescription: document.description,
        sectionTitle: section.title,
        content: fullText,
        metadata: aggregatedMetadata,
        sourceFile: document.sourceFile,
      },
    ];
  }

  const minChunkLength = Math.max(80, Math.min(200, overlapSize));
  let startIndex = 0;

  while (startIndex < fullText.length) {
    const rawEndIndex = Math.min(startIndex + maxChunkSize, fullText.length);
    const endIndex = findSafeSplitIndex(
      fullText,
      rawEndIndex,
      startIndex + minChunkLength,
    );

    const chunkContent = fullText.slice(startIndex, endIndex).trim();

    if (chunkContent.length > 0) {
      finalChunks.push({
        documentTitle: document.title,
        documentDescription: document.description,
        sectionTitle: section.title,
        content: chunkContent,
        metadata: aggregatedMetadata,
        sourceFile: document.sourceFile,
      });
    }

    if (endIndex >= fullText.length) {
      break;
    }

    const nextStartIndex = Math.max(startIndex + 1, endIndex - overlapSize);

    if (nextStartIndex <= startIndex) {
      break;
    }

    startIndex = nextStartIndex;
  }

  return finalChunks;
}
