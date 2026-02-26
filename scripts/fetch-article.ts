#!/usr/bin/env npx tsx
/**
 * Standalone script to fetch an article using Playwright + Defuddle.
 * Called as a child process by the annotation API Vite plugin to avoid
 * Vite's module runner trying to process Playwright.
 *
 * Usage: npx tsx scripts/fetch-article.ts <url>
 * Outputs: JSON { title, author, content, slug, sourceUrl } on stdout
 */
import { fetchArticle } from "../src/lib/article-fetcher";

const url = process.argv[2];
if (!url) {
  process.stderr.write("Usage: fetch-article.ts <url>\n");
  process.exit(1);
}

const article = await fetchArticle(url);
process.stdout.write(JSON.stringify(article));
