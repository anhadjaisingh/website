import fs from "node:fs";
import path from "node:path";
import { fetchArticle } from "../src/lib/article-fetcher";

const url = process.argv[2];

if (!url) {
  console.error("Usage: npx tsx scripts/annotate.ts <url>");
  process.exit(1);
}

async function main() {
  console.log(`Fetching: ${url}`);

  const article = await fetchArticle(url);

  const dir = path.join(process.cwd(), "src/content/annotations", article.slug);
  fs.mkdirSync(dir, { recursive: true });

  // Write source.md
  const today = new Date().toISOString().split("T")[0];
  const frontmatter = [
    "---",
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `author: "${article.author.replace(/"/g, '\\"')}"`,
    `sourceUrl: "${url}"`,
    `snapshotDate: ${today}`,
    `description: "My annotated reading of ${article.title.replace(/"/g, '\\"')}."`,
    `tags: []`,
    "---",
  ].join("\n");

  const sourcePath = path.join(dir, "source.md");
  fs.writeFileSync(sourcePath, `${frontmatter}\n\n${article.content}\n`);

  // Write empty annotations.yaml
  const yamlPath = path.join(dir, "annotations.yaml");
  fs.writeFileSync(yamlPath, "annotations: []\n");

  console.log(`\nCreated annotation directory:`);
  console.log(`  ${sourcePath}`);
  console.log(`  ${yamlPath}`);
  console.log(`\nNext steps:`);
  console.log(
    `  1. Fill in the "author" field in source.md if not auto-detected`,
  );
  console.log(`  2. Run 'npm run dev' and annotate in the browser`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
