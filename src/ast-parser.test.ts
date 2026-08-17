import assert from "node:assert/strict";
import { sanitizeGeneratedMdxComments } from "./ast-parser.js";

const input = `---
title: Test
---

Hello

{/* DO NOT EDIT. The content of this doc is generated from the source above. To edit the content of this page, navigate to the source page in your editor. */}

World
`;

const output = sanitizeGeneratedMdxComments(input);

assert.ok(
  !output.includes("DO NOT EDIT"),
  "Generated warning comments should be removed",
);
assert.ok(
  output.includes("Hello"),
  "The content before the comment should remain",
);
assert.ok(
  output.includes("World"),
  "The content after the comment should remain",
);

console.log("ast-parser sanitization test passed");
