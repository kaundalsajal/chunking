import type { BlockType, ChunkBlock, ChunkMetadata } from "../types/index.js";

function getMdastText(node: any): string {
  if (node.value) {
    return node.value;
  }
  if (node.children) {
    return node.children.map((child: any) => getMdastText(child)).join("");
  }
  return "";
}

export function extractBlock(node: any): ChunkBlock | null {
  const type = node.type;
  
  if (type === "heading") {
    return {
      type: "heading",
      content: getMdastText(node)
    };
  }

  if (type === "paragraph" || type === "blockquote") {
    return {
      type: type as BlockType,
      content: getMdastText(node)
    };
  }

  if (type === "code") {
    return {
      type: "code",
      content: node.value,
      metadata: {
        language: node.lang
      }
    };
  }

  if (type === "list") {
    return {
      type: "list",
      content: getMdastText(node) // Lists contain listItems, which contain text
    };
  }

  // Handle MDX specific tags like <AppOnly> and <PagesOnly>
  if (type === "mdxJsxFlowElement" || type === "mdxJsxTextElement") {
    const tagName = node.name;
    const content = getMdastText(node);
    
    let router: "approuter" | "pagerouter" | undefined;
    if (tagName === "AppOnly") {
      router = "approuter";
    } else if (tagName === "PagesOnly") {
      router = "pagerouter";
    }

    if (router) {
      return {
        type: "mdx-tag",
        content,
        metadata: {
          router
        }
      };
    }
  }

  // Fallback for unhandled types, if they have content we can extract
  const text = getMdastText(node);
  if (text.trim().length > 0) {
     return {
       type: "unknown",
       content: text
     };
  }

  return null;
}
