export type BlockType = 
  | "paragraph" 
  | "code" 
  | "list" 
  | "heading" 
  | "blockquote" 
  | "mdx-tag" 
  | "text" 
  | "unknown";

export interface ChunkMetadata {
  language?: string; // for code blocks
  router?: "approuter" | "pagerouter"; // for MDX tags like <AppOnly> or <PagesOnly>
  [key: string]: any;
}

export interface ChunkBlock {
  type: BlockType;
  content: string;
  metadata?: ChunkMetadata;
}

export interface SectionChunk {
  title: string;
  level: number; // heading depth, 0 for intro (before first heading)
  blocks: ChunkBlock[];
}

// Final output chunk format
export interface FinalChunk {
  documentTitle: string;
  documentDescription?: string | undefined;
  sectionTitle: string;
  content: string; // The joined overlapping text
  metadata: ChunkMetadata; // Aggregated metadata (e.g., if there's approuter tag)
  sourceFile: string; // The original markdown file name
}

export interface DocumentData {
  title: string;
  description?: string | undefined;
  sourceFile: string;
  sections: SectionChunk[];
}
