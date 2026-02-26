import { JSDOM } from "jsdom";
import { chromium } from "playwright";

export interface FetchedArticle {
  title: string;
  author: string;
  content: string; // markdown
  slug: string;
  sourceUrl: string;
}

export function generateSlug(title: string): string {
  if (!title || title.trim().length === 0) return "untitled";
  return title
    .toLowerCase()
    .replace(/['\u2019]/g, "") // strip apostrophes/smart quotes to keep contractions joined
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fetch a URL using Playwright (renders JS), extract content with Defuddle,
 * and return markdown + metadata.
 */
export async function fetchArticle(url: string): Promise<FetchedArticle> {
  // 1. Render the page with Playwright
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    const html = await page.content();

    // 2. Extract content with Defuddle (node API is async)
    const { Defuddle } = await import("defuddle/node");
    const result = await Defuddle(html, url, { markdown: true });

    if (!result?.content) {
      throw new Error("Defuddle could not extract content from the page.");
    }

    const title = result.title || "Untitled";
    const author = result.author || "";

    return {
      title,
      author,
      content: result.content,
      slug: generateSlug(title),
      sourceUrl: url,
    };
  } finally {
    await browser.close();
  }
}
