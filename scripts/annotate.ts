import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import fs from "node:fs";
import path from "node:path";

const url = process.argv[2];

if (!url) {
  console.error("Usage: npx tsx scripts/annotate.ts <url>");
  process.exit(1);
}

async function main() {
  console.log(`Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const html = await response.text();

  // Parse HTML and extract readable content
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article?.content) {
    console.error("Could not extract readable content from the page.");
    process.exit(1);
  }

  // Convert HTML content to markdown
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  const markdown = turndown.turndown(article.content);

  // Generate slug from title
  const slug = (article.title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Create directory
  const dir = path.join(process.cwd(), "src/content/annotations", slug);
  fs.mkdirSync(dir, { recursive: true });

  // Write source.md
  const today = new Date().toISOString().split("T")[0];
  const frontmatter = [
    "---",
    `title: "${article.title?.replace(/"/g, '\\"') || "Untitled"}"`,
    `author: ""`,
    `sourceUrl: "${url}"`,
    `snapshotDate: ${today}`,
    `description: "My annotated reading of ${article.title || "this article"}."`,
    `tags: []`,
    "---",
  ].join("\n");

  const sourcePath = path.join(dir, "source.md");
  fs.writeFileSync(sourcePath, `${frontmatter}\n\n${markdown}\n`);

  // Write starter annotations.yaml
  const starterYaml = `annotations:
  # Add your annotations here. Example:
  # - id: "a1"
  #   anchor: "text to highlight"
  #   type: "margin"  # or "inline"
  #   note: "Your commentary here."
`;

  const yamlPath = path.join(dir, "annotations.yaml");
  fs.writeFileSync(yamlPath, starterYaml);

  console.log(`\nCreated annotation directory:`);
  console.log(`  ${sourcePath}`);
  console.log(`  ${yamlPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Fill in the "author" field in source.md frontmatter`);
  console.log(`  2. Edit annotations.yaml to add your annotations`);
  console.log(`  3. Run 'npm run dev' to preview`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
