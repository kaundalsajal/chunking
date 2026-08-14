import type { SectionChunk, ChunkBlock } from "../types/index.js";
import { extractBlock } from "./block-extractor.js";

export function extractSections(ast: any): SectionChunk[] {
  const sections: SectionChunk[] = [];
  
  // Implicit introduction section (content before first heading)
  let currentSection: SectionChunk = {
    title: "Introduction",
    level: 0,
    blocks: []
  };
  
  sections.push(currentSection);

  for (const node of ast.children) {
    if (node.type === "heading") {
      const headingBlock = extractBlock(node);
      if (headingBlock) {
        currentSection = {
          title: headingBlock.content,
          level: node.depth,
          blocks: []
        };
        sections.push(currentSection);
      }
      continue;
    }

    const block = extractBlock(node);
    if (block) {
      currentSection.blocks.push(block);
    }
  }

  // Filter out any sections that end up with no blocks and are just the placeholder intro
  return sections.filter(sec => sec.blocks.length > 0);
}
