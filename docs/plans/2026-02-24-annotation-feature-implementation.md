# Annotation Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build v1 of the annotation feature — publish annotated readings of external articles with highlighted text, margin notes, and inline commentary.

**Architecture:** Astro content collection for source articles, YAML sidecar for annotations, React island component for interactive rendering. CLI script for fetching/snapshotting articles.

**Tech Stack:** Astro v5, React (island), js-yaml, @mozilla/readability, Turndown (HTML→MD), Tailwind CSS v4

---

### Task 1: Add React Integration and Dependencies

**Files:**

- Modify: `astro.config.mjs`
- Modify: `package.json`

**Step 1: Install React integration and annotation dependencies**

```bash
npx astro add react --yes
npm install js-yaml
npm install --save-dev @types/js-yaml
```

Note: `@astrojs/react` adds `react` and `react-dom` as dependencies automatically.

**Step 2: Verify astro.config.mjs has React integration**

The `astro add react` command should add the integration. Verify the config looks like:

```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://ffledgling.dev",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Step 3: Verify build still works**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add package.json package-lock.json astro.config.mjs
git commit -m "feat: add React integration and js-yaml dependency"
```

---

### Task 2: Annotation Content Collection Schema

**Files:**

- Modify: `src/content.config.ts`
- Create: `src/content/annotations/.gitkeep`

**Step 1: Add annotations collection to content config**

Add to `src/content.config.ts`:

```typescript
const annotations = defineCollection({
  loader: glob({ pattern: "**/source.md", base: "./src/content/annotations" }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    sourceUrl: z.string().url(),
    snapshotDate: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});
```

Update the exports:

```typescript
export const collections = { blog, projects, annotations };
```

**Step 2: Create the annotations content directory**

```bash
mkdir -p src/content/annotations
touch src/content/annotations/.gitkeep
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/content.config.ts src/content/annotations/.gitkeep
git commit -m "feat: add annotations content collection schema"
```

---

### Task 3: Anchor Matching Algorithm

The core logic for finding annotation anchors in source text and producing highlighted segments.

**Files:**

- Create: `src/lib/annotations.ts`
- Create: `tests/unit/annotations.test.ts`

**Step 1: Write the failing tests**

Create `tests/unit/annotations.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  findAnchorPosition,
  buildAnnotatedSegments,
  type Annotation,
  type AnnotatedSegment,
} from "../../src/lib/annotations";

describe("findAnchorPosition", () => {
  it("finds a simple text match", () => {
    const text = "The quick brown fox jumps over the lazy dog.";
    const result = findAnchorPosition(text, "brown fox");
    expect(result).toEqual({ start: 10, end: 19 });
  });

  it("returns null for no match", () => {
    const text = "The quick brown fox.";
    const result = findAnchorPosition(text, "red cat");
    expect(result).toBeNull();
  });

  it("finds first occurrence by default", () => {
    const text = "foo bar foo bar foo";
    const result = findAnchorPosition(text, "foo");
    expect(result).toEqual({ start: 0, end: 3 });
  });

  it("uses startContext to disambiguate", () => {
    const text = "foo bar foo baz foo";
    const result = findAnchorPosition(text, "foo", "baz");
    expect(result).toEqual({ start: 16, end: 19 });
  });

  it("handles startContext that appears before anchor", () => {
    const text = "alpha beta gamma delta beta epsilon";
    const result = findAnchorPosition(text, "beta", "delta");
    expect(result).toEqual({ start: 27, end: 31 });
  });
});

describe("buildAnnotatedSegments", () => {
  it("returns full text as plain when no annotations", () => {
    const result = buildAnnotatedSegments("Hello world", []);
    expect(result).toEqual([{ type: "text", content: "Hello world" }]);
  });

  it("splits text around a single annotation", () => {
    const annotations: Annotation[] = [
      { id: "a1", anchor: "brown fox", type: "margin", note: "Nice!" },
    ];
    const result = buildAnnotatedSegments(
      "The quick brown fox jumps.",
      annotations,
    );
    expect(result).toEqual([
      { type: "text", content: "The quick " },
      {
        type: "highlight",
        content: "brown fox",
        annotation: annotations[0],
      },
      { type: "text", content: " jumps." },
    ]);
  });

  it("handles multiple non-overlapping annotations", () => {
    const annotations: Annotation[] = [
      { id: "a1", anchor: "quick", type: "margin", note: "Speed!" },
      { id: "a2", anchor: "lazy", type: "inline", note: "Slow!" },
    ];
    const result = buildAnnotatedSegments(
      "The quick brown fox jumps over the lazy dog.",
      annotations,
    );
    expect(result.length).toBe(5);
    expect(result[1]).toEqual({
      type: "highlight",
      content: "quick",
      annotation: annotations[0],
    });
    expect(result[3]).toEqual({
      type: "highlight",
      content: "lazy",
      annotation: annotations[1],
    });
  });

  it("skips annotations with no match in text", () => {
    const annotations: Annotation[] = [
      { id: "a1", anchor: "nonexistent", type: "margin", note: "Ghost" },
    ];
    const result = buildAnnotatedSegments("Hello world", annotations);
    expect(result).toEqual([{ type: "text", content: "Hello world" }]);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/unit/annotations.test.ts
```

Expected: FAIL (module not found)

**Step 3: Implement the anchor matching algorithm**

Create `src/lib/annotations.ts`:

```typescript
export interface Annotation {
  id: string;
  anchor: string;
  startContext?: string;
  type: "margin" | "inline";
  note: string;
}

export interface AnnotatedSegment {
  type: "text" | "highlight";
  content: string;
  annotation?: Annotation;
}

export interface AnchorPosition {
  start: number;
  end: number;
}

/**
 * Find the position of an anchor string in text.
 * If startContext is provided, finds the anchor occurrence that appears
 * after the startContext string.
 */
export function findAnchorPosition(
  text: string,
  anchor: string,
  startContext?: string,
): AnchorPosition | null {
  if (startContext) {
    const contextIndex = text.indexOf(startContext);
    if (contextIndex === -1) return null;
    const searchFrom = contextIndex + startContext.length;
    const anchorIndex = text.indexOf(anchor, searchFrom);
    if (anchorIndex === -1) return null;
    return { start: anchorIndex, end: anchorIndex + anchor.length };
  }

  const index = text.indexOf(anchor);
  if (index === -1) return null;
  return { start: index, end: index + anchor.length };
}

/**
 * Build an array of text and highlight segments from source text and annotations.
 * Annotations are matched in order and non-overlapping.
 */
export function buildAnnotatedSegments(
  text: string,
  annotations: Annotation[],
): AnnotatedSegment[] {
  // Find positions for all annotations
  const positioned: { annotation: Annotation; start: number; end: number }[] =
    [];

  for (const ann of annotations) {
    const pos = findAnchorPosition(text, ann.anchor, ann.startContext);
    if (pos) {
      positioned.push({ annotation: ann, start: pos.start, end: pos.end });
    }
  }

  // Sort by start position
  positioned.sort((a, b) => a.start - b.start);

  // Remove overlapping annotations (keep earlier one)
  const filtered: typeof positioned = [];
  let lastEnd = 0;
  for (const p of positioned) {
    if (p.start >= lastEnd) {
      filtered.push(p);
      lastEnd = p.end;
    }
  }

  // Build segments
  if (filtered.length === 0) {
    return [{ type: "text", content: text }];
  }

  const segments: AnnotatedSegment[] = [];
  let cursor = 0;

  for (const p of filtered) {
    if (p.start > cursor) {
      segments.push({ type: "text", content: text.slice(cursor, p.start) });
    }
    segments.push({
      type: "highlight",
      content: text.slice(p.start, p.end),
      annotation: p.annotation,
    });
    cursor = p.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test -- tests/unit/annotations.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/annotations.ts tests/unit/annotations.test.ts
git commit -m "feat: add anchor matching algorithm with tests"
```

---

### Task 4: AnnotatedArticle React Component

The interactive React island that renders the annotated article with highlights, margin notes, and inline notes.

**Files:**

- Create: `src/components/AnnotatedArticle.tsx`

**Step 1: Create the React component**

Create `src/components/AnnotatedArticle.tsx`:

```tsx
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  buildAnnotatedSegments,
  type Annotation,
  type AnnotatedSegment,
} from "../lib/annotations";

interface Props {
  /** The full source article text (plain text extracted from HTML) */
  sourceHtml: string;
  /** Array of annotations to overlay on the text */
  annotations: Annotation[];
}

function MarginNote({
  annotation,
  anchorRef,
}: {
  annotation: Annotation;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const [top, setTop] = useState(0);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const containerRect = anchorRef.current
        .closest(".annotated-article")
        ?.getBoundingClientRect();
      if (containerRect) {
        setTop(rect.top - containerRect.top);
      }
    }
  }, [anchorRef]);

  return (
    <div
      className="absolute right-0 translate-x-[calc(100%+1.5rem)] w-48 text-sm text-stone-600 dark:text-stone-400 hidden xl:block"
      style={{ top: `${top}px` }}
    >
      <div className="border-l-2 border-accent/30 pl-3 py-1">
        {annotation.note}
      </div>
    </div>
  );
}

function MobilePopover({
  annotation,
  onClose,
}: {
  annotation: Annotation;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 mb-2 p-3 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-sm xl:hidden">
      <div className="flex justify-between items-start gap-2">
        <p className="text-stone-700 dark:text-stone-300">{annotation.note}</p>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 shrink-0"
          aria-label="Close annotation"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function HighlightedText({
  segment,
}: {
  segment: AnnotatedSegment & { type: "highlight" };
}) {
  const [showPopover, setShowPopover] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);

  if (!segment.annotation) return <>{segment.content}</>;

  return (
    <>
      <mark
        ref={anchorRef}
        className="bg-amber-100 dark:bg-amber-900/40 text-inherit cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors rounded-sm px-0.5 -mx-0.5 relative"
        onClick={() => setShowPopover(!showPopover)}
        role="button"
        tabIndex={0}
        aria-label={`Annotation: ${segment.annotation.note.slice(0, 50)}...`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowPopover(!showPopover);
        }}
      >
        {segment.content}
      </mark>
      {segment.annotation.type === "margin" && (
        <MarginNote annotation={segment.annotation} anchorRef={anchorRef} />
      )}
      {showPopover && segment.annotation.type === "margin" && (
        <MobilePopover
          annotation={segment.annotation}
          onClose={() => setShowPopover(false)}
        />
      )}
      {showPopover && segment.annotation.type === "inline" && (
        <div className="block mt-3 mb-3 p-4 bg-stone-50 dark:bg-stone-800/50 border-l-4 border-accent/50 rounded-r-lg text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {segment.annotation.note}
        </div>
      )}
    </>
  );
}

function AnnotatedParagraph({
  paragraphHtml,
  annotations,
}: {
  paragraphHtml: string;
  annotations: Annotation[];
}) {
  const segments = buildAnnotatedSegments(paragraphHtml, annotations);

  // Find inline annotations that matched in this paragraph
  const inlineAnnotations = segments
    .filter(
      (s): s is AnnotatedSegment & { type: "highlight" } =>
        s.type === "highlight" && s.annotation?.type === "inline",
    )
    .map((s) => s.annotation!);

  return (
    <div className="mb-4 relative">
      <p className="leading-relaxed text-lg">
        {segments.map((segment, i) =>
          segment.type === "text" ? (
            <span key={i}>{segment.content}</span>
          ) : (
            <HighlightedText
              key={i}
              segment={segment as AnnotatedSegment & { type: "highlight" }}
            />
          ),
        )}
      </p>
    </div>
  );
}

export default function AnnotatedArticle({ sourceHtml, annotations }: Props) {
  // Split source into paragraphs (by double newlines)
  const paragraphs = sourceHtml
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="annotated-article relative">
      {paragraphs.map((para, i) => (
        <AnnotatedParagraph
          key={i}
          paragraphHtml={para}
          annotations={annotations}
        />
      ))}
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/AnnotatedArticle.tsx
git commit -m "feat: add AnnotatedArticle React component"
```

---

### Task 5: Annotation Pages (Listing + Detail)

**Files:**

- Create: `src/pages/annotations/index.astro`
- Create: `src/pages/annotations/[...slug].astro`

**Step 1: Create the annotations listing page**

Create `src/pages/annotations/index.astro`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";
import { formatDate } from "../../lib/utils";

const annotatedArticles = (await getCollection("annotations")).sort(
  (a, b) => b.data.snapshotDate.valueOf() - a.data.snapshotDate.valueOf(),
);
---

<BaseLayout title="Annotations">
  <section>
    <h1 class="font-serif text-4xl font-bold mb-2">Annotated Readings</h1>
    <p class="text-stone-500 dark:text-stone-400 mb-8 max-w-prose">
      Articles I've read closely and annotated with my commentary.
    </p>

    {
      annotatedArticles.length === 0 ? (
        <p class="text-stone-500 dark:text-stone-400 italic">
          No annotated articles yet. Check back soon.
        </p>
      ) : (
        <ul class="space-y-8">
          {annotatedArticles.map((article) => (
            <li>
              <a href={`/annotations/${article.id}`} class="group block">
                <h2 class="text-xl font-semibold group-hover:text-accent transition-colors">
                  {article.data.title}
                </h2>
                <div class="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  by {article.data.author} · Annotated{" "}
                  <time datetime={article.data.snapshotDate.toISOString()}>
                    {formatDate(article.data.snapshotDate)}
                  </time>
                </div>
                <p class="text-stone-600 dark:text-stone-400 mt-2">
                  {article.data.description}
                </p>
                {article.data.tags.length > 0 && (
                  <div class="flex gap-2 mt-2 text-sm">
                    {article.data.tags.map((tag: string) => (
                      <span class="text-accent">#{tag}</span>
                    ))}
                  </div>
                )}
              </a>
            </li>
          ))}
        </ul>
      )
    }
  </section>
</BaseLayout>
```

**Step 2: Create the annotation detail page**

Create `src/pages/annotations/[...slug].astro`:

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import AnnotatedArticle from "../../components/AnnotatedArticle";
import { formatDate } from "../../lib/utils";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Annotation } from "../../lib/annotations";

export async function getStaticPaths() {
  const articles = await getCollection("annotations");
  return articles.map((article) => ({
    params: { slug: article.id },
    props: { article },
  }));
}

const { article } = Astro.props;

// Read the sibling annotations.yaml file
const annotationsDir = path.join(
  process.cwd(),
  "src/content/annotations",
  article.id,
);
const yamlPath = path.join(annotationsDir, "annotations.yaml");

let annotations: Annotation[] = [];
if (fs.existsSync(yamlPath)) {
  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const parsed = yaml.load(yamlContent) as {
    annotations?: Annotation[];
  } | null;
  annotations = parsed?.annotations ?? [];
}

// Read the source markdown body (strip frontmatter)
const sourcePath = path.join(annotationsDir, "source.md");
const sourceContent = fs.readFileSync(sourcePath, "utf-8");
const bodyMatch = sourceContent.match(/^---[\s\S]*?---\s*\n([\s\S]*)$/);
const sourceBody = bodyMatch ? bodyMatch[1].trim() : sourceContent;
---

<BaseLayout
  title={`Annotated: ${article.data.title}`}
  description={article.data.description}
>
  <article class="max-w-prose mx-auto xl:max-w-none xl:px-8">
    <header class="mb-8 max-w-prose mx-auto">
      <p
        class="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2"
      >
        Annotated Reading
      </p>
      <h1 class="font-serif text-3xl md:text-4xl font-bold mb-3">
        {article.data.title}
      </h1>
      <p class="text-stone-600 dark:text-stone-400 mb-4">
        by {article.data.author}
      </p>
      <div
        class="text-sm text-stone-500 dark:text-stone-400 flex flex-wrap gap-x-4"
      >
        <a
          href={article.data.sourceUrl}
          class="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Original article ↗
        </a>
        <span>
          Snapshotted{" "}
          <time datetime={article.data.snapshotDate.toISOString()}>
            {formatDate(article.data.snapshotDate)}
          </time>
        </span>
      </div>
      {
        article.data.tags.length > 0 && (
          <div class="flex gap-2 mt-3 text-sm">
            {article.data.tags.map((tag: string) => (
              <span class="text-accent">#{tag}</span>
            ))}
          </div>
        )
      }
    </header>

    <div class="max-w-prose mx-auto">
      <AnnotatedArticle
        client:load
        sourceHtml={sourceBody}
        annotations={annotations}
      />
    </div>
  </article>
</BaseLayout>
```

**Step 3: Verify build**

```bash
npm run build
```

Note: Build may show warnings about empty annotations collection. That's fine — the listing page handles empty state.

**Step 4: Commit**

```bash
git add src/pages/annotations/
git commit -m "feat: add annotation listing and detail pages"
```

---

### Task 6: Add Navigation Link for Annotations

**Files:**

- Modify: `src/components/Header.astro`

**Step 1: Add "Annotations" to the nav links array**

In `src/components/Header.astro`, add the annotations link to the `navLinks` array after "Blog":

```typescript
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/annotations", label: "Annotations" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/links", label: "Links" },
  { href: "/contact", label: "Contact" },
];
```

**Step 2: Verify build and check nav appears**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: add Annotations link to navigation"
```

---

### Task 7: Sample Annotated Article (Demo Content)

Create a real sample annotated article to demonstrate the feature works end-to-end. Use Paul Graham's "Do Things That Don't Scale" essay as the sample.

**Files:**

- Create: `src/content/annotations/do-things-that-dont-scale/source.md`
- Create: `src/content/annotations/do-things-that-dont-scale/annotations.yaml`

**Step 1: Create the source.md with a snippet of the essay**

Create `src/content/annotations/do-things-that-dont-scale/source.md` with frontmatter and a representative excerpt (not the full essay — keep it to ~500 words for demo purposes):

```markdown
---
title: "Do Things That Don't Scale"
author: "Paul Graham"
sourceUrl: "http://paulgraham.com/ds.html"
snapshotDate: 2026-02-24
description: "My annotated reading of Paul Graham's essay on doing unscalable things in the early days of a startup."
tags: ["startups", "paul-graham", "growth"]
---

One of the most common types of advice we give at Y Combinator is to do things that don't scale. A lot of would-be founders believe that startups either take off or don't. You build something, make it available, and if you've made a better mousetrap, people beat a path to your door as promised. Or they don't, in which case the market must not exist.

Actually startups take off because the founders make them take off. There may be a handful that just grew by themselves, but usually it takes some sort of push to get them going. A good metaphor would be the crank that car engines had before they got electric starters. Once the engine was going, it would keep going, but there was a separate and laborious process to get it going.

The most common unscalable thing founders have to do at the start is to recruit users manually. Nearly all startups have to. You can't wait for users to come to you. You have to go out and get them.

Stripe is one of the most successful startups we've funded, and the technique they used to recruit users was famously effective. It was called "Collison installation." More diffident founders ask "Will you try our beta?" and if the answer is yes, they say "Great, we'll send you a link." But the Collison brothers weren't going to wait. When anyone agreed to try Stripe, they'd say "Right then, give me your laptop" and set them up on the spot.

There are two reasons founders resist going out and recruiting users individually. One is a combination of shyness and laziness. They'd rather sit at home writing code than go out and talk to a bunch of strangers and most likely be rejected by most of them. But for a startup to succeed, at least one founder (usually the CEO) will have to spend a lot of time on sales and marketing.

The other reason founders ignore this path is that the absolute numbers seem so small at first. This can't be how the big, famous startups got started, they think. The mistake they make is to underestimate the power of compound growth. We encourage every startup to measure their progress by weekly growth rate. If you have 100 users, you need to get 10 more next week to grow 10% a week. And while 110 may not seem much better than 100, if you keep growing at 10% a week you'll be surprised how big the numbers get. After a year you'll have 14,000 users, and after 2 years you'll have 2 million.
```

**Step 2: Create annotations.yaml with sample annotations**

Create `src/content/annotations/do-things-that-dont-scale/annotations.yaml`:

```yaml
annotations:
  - id: "a1"
    anchor: "do things that don't scale"
    type: "margin"
    note: "This phrase has become startup gospel, but it's worth reading the original argument carefully."

  - id: "a2"
    anchor: "the founders make them take off"
    type: "margin"
    note: "Agency over luck. The best founders I've met all share this belief."

  - id: "a3"
    anchor: "recruit users manually"
    type: "inline"
    note: "This is the core insight of the essay. Every successful startup I know did some version of this — whether it was going door to door, cold emailing, or showing up at conferences. The founders who skip this step usually fail because they never develop the tight feedback loop with real users that manual recruiting creates."

  - id: "a4"
    anchor: "Collison installation"
    type: "margin"
    note: "Legendary move. Don't ask permission, just set it up."

  - id: "a5"
    anchor: "underestimate the power of compound growth"
    type: "inline"
    note: "This math is what makes the 'do things that don't scale' advice work. You only need to manually recruit the first cohort — after that, compound growth takes over. But you have to actually do the manual work first to prime the pump."
```

**Step 3: Verify by building and running dev server**

```bash
npm run build
```

If the build succeeds, the content collection picked up the new article and the pages rendered.

**Step 4: Remove the .gitkeep (no longer needed)**

```bash
rm src/content/annotations/.gitkeep
```

**Step 5: Commit**

```bash
git add src/content/annotations/do-things-that-dont-scale/
git commit -m "feat: add sample annotated article (Paul Graham - Do Things That Don't Scale)"
```

---

### Task 8: CLI Authoring Script

The CLI tool for fetching external articles and creating the annotation directory structure.

**Files:**

- Create: `scripts/annotate.ts`

**Step 1: Install script dependencies**

```bash
npm install @mozilla/readability linkedom turndown
npm install --save-dev @types/turndown
```

- `@mozilla/readability` — Mozilla's Readability algorithm for extracting article content
- `linkedom` — Lightweight DOM implementation for server-side use (Readability needs a DOM)
- `turndown` — HTML to Markdown converter

**Step 2: Create the CLI script**

Create `scripts/annotate.ts`:

```typescript
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

  if (!article) {
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
```

**Step 3: Add a convenience script to package.json**

Add to `package.json` scripts:

```json
"annotate": "tsx scripts/annotate.ts"
```

**Step 4: Verify the script runs**

```bash
npx tsx scripts/annotate.ts --help 2>&1 || true
```

(Just verify it loads without crashing — actual URL fetching is manual)

**Step 5: Commit**

```bash
git add scripts/annotate.ts package.json package-lock.json
git commit -m "feat: add CLI script for creating annotated article scaffolds"
```

---

### Task 9: E2E Tests for Annotations

**Files:**

- Create: `tests/e2e/annotations.spec.ts`

**Step 1: Write E2E tests**

Create `tests/e2e/annotations.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Annotations listing page", () => {
  test("renders the annotations listing", async ({ page }) => {
    await page.goto("/annotations");
    await expect(page.locator("h1")).toContainText("Annotated Readings");
  });

  test("lists the sample annotated article", async ({ page }) => {
    await page.goto("/annotations");
    await expect(page.locator("text=Do Things That Don't Scale")).toBeVisible();
    await expect(page.locator("text=Paul Graham")).toBeVisible();
  });

  test("links to the annotation detail page", async ({ page }) => {
    await page.goto("/annotations");
    await page.click("text=Do Things That Don't Scale");
    await expect(page).toHaveURL(/\/annotations\/do-things-that-dont-scale/);
  });
});

test.describe("Annotation detail page", () => {
  test("renders the article header with attribution", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    await expect(page.locator("h1")).toContainText(
      "Do Things That Don't Scale",
    );
    await expect(page.locator("text=Paul Graham")).toBeVisible();
    await expect(page.locator("text=Original article")).toBeVisible();
  });

  test("renders highlighted annotation text", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const highlights = page.locator("mark");
    await expect(highlights.first()).toBeVisible();
  });

  test("shows annotation popover on highlight click", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const firstHighlight = page.locator("mark").first();
    await firstHighlight.click();
    // Should show the annotation note text
    await expect(page.locator("text=startup gospel")).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

```bash
npm run build && npx playwright test tests/e2e/annotations.spec.ts
```

**Step 3: Commit**

```bash
git add tests/e2e/annotations.spec.ts
git commit -m "test: add E2E tests for annotation pages"
```

---

### Task 10: Final Build Verification and Polish

**Step 1: Run full test suite**

```bash
npm run test
npm run build
npx playwright test
```

**Step 2: Fix any lint issues**

```bash
npm run lint:fix
```

**Step 3: Verify dev server works**

```bash
npm run dev
```

Check that:

- `/annotations` listing shows the sample article
- `/annotations/do-things-that-dont-scale` renders with highlights
- Clicking highlights shows annotations
- Navigation link works

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: annotation feature polish and lint fixes"
```
