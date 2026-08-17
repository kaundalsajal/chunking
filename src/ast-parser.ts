import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";

export function sanitizeGeneratedMdxComments(content: string): string {
  return content.replace(/{\s*\/\*\s*DO NOT EDIT\.[\s\S]*?\*\/\s*}/g, "");
}

export const getAST = (content: string) => {
  const sanitizedContent = sanitizeGeneratedMdxComments(content);
  return unified().use(remarkParse).use(remarkMdx).parse(sanitizedContent);
};
