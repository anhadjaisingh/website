# Annotation Authoring UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based inline authoring UI for creating and editing annotated readings during local dev, with improved content extraction using Defuddle.

**Architecture:** Vite plugin adds dev-only API middleware for annotation CRUD. The existing AnnotatedArticle React component gains an edit mode with text selection, annotation forms, and edit/delete. Defuddle + Playwright replace Readability for richer content extraction. Annotation notes render as markdown.

**Tech Stack:** Astro v5, React (island), Defuddle (content extraction), JSDOM (for Defuddle Node.js), marked (markdown rendering), Playwright (page rendering for fetch), js-yaml, Tailwind CSS v4

**Design doc:** `docs/plans/2026-02-26-annotation-authoring-ui-design.md`

**Spec tests:** `tests/e2e/annotations-spec.test.ts` — 21 passing tests define the rendering contract. Do NOT break these.

---

### Task 1: Install Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install new dependencies**

```bash
npm install defuddle jsdom marked
npm install --save-dev @types/jsdom
```

- `defuddle` — content extraction, replaces @mozilla/readability
- `jsdom` — DOM implementation required by defuddle/node
- `marked` — renders markdown in annotation notes

**Step 2: Remove old dependencies**

```bash
npm uninstall @mozilla/readability linkedom
```

**Step 3: Verify build still passes**

```bash
npm run build
```

Expected: Build succeeds. The only file importing the old deps is `scripts/annotate.ts` — it will break but we'll fix it in Task 5.

**Step 4: Verify existing spec tests still pass**

```bash
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All 21 tests PASS (dependency swap doesn't affect the built site).

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add defuddle, jsdom, marked; remove readability, linkedom"
```

---

### Task 2: Article Fetcher Library

The shared logic for fetching a URL with Playwright, extracting content with Defuddle, and producing markdown + metadata. Used by both the API route (Task 3) and the CLI script (Task 5).

**Files:**

- Create: `src/lib/article-fetcher.ts`
- Create: `tests/unit/article-fetcher.test.ts`

**Step 1: Write the unit tests**

Create `tests/unit/article-fetcher.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateSlug } from "../../src/lib/article-fetcher";

describe("generateSlug", () => {
  it("converts a title to a URL-safe slug", () => {
    expect(generateSlug("Do Things That Don't Scale")).toBe(
      "do-things-that-dont-scale",
    );
  });

  it("handles special characters", () => {
    expect(generateSlug("Hello, World! (2026)")).toBe("hello-world-2026");
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug("---test---")).toBe("test");
  });

  it("returns 'untitled' for empty string", () => {
    expect(generateSlug("")).toBe("untitled");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/unit/article-fetcher.test.ts
```

Expected: FAIL (module not found)

**Step 3: Implement the article fetcher**

Create `src/lib/article-fetcher.ts`:

```typescript
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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

    // 2. Extract content with Defuddle
    // Dynamic import because defuddle/node uses ESM
    const { Defuddle } = await import("defuddle/node");
    const dom = new JSDOM(html, { url });
    const result = Defuddle(dom, url, { markdown: true });

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
```

**Step 4: Run tests to verify they pass**

```bash
npm run test -- tests/unit/article-fetcher.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/article-fetcher.ts tests/unit/article-fetcher.test.ts
git commit -m "feat: add article fetcher using Playwright + Defuddle"
```

---

### Task 3: Dev-Only API Middleware (Vite Plugin)

A Vite plugin that adds API middleware to the dev server. Handles annotation CRUD operations. Does nothing during production builds.

**Files:**

- Create: `src/lib/annotation-api.ts`
- Modify: `astro.config.mjs`

**Step 1: Create the API handler module**

Create `src/lib/annotation-api.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Annotation } from "./annotations";
import { fetchArticle } from "./article-fetcher";
import type { IncomingMessage, ServerResponse } from "node:http";

const ANNOTATIONS_DIR = path.join(process.cwd(), "src/content/annotations");

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function jsonResponse(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

/**
 * POST /api/annotations/create
 * Body: { url: string }
 * Creates source.md + annotations.yaml from a URL.
 */
async function handleCreate(req: IncomingMessage, res: ServerResponse) {
  const body = JSON.parse(await parseBody(req));
  const { url } = body;

  if (!url || typeof url !== "string") {
    return jsonResponse(res, 400, { error: "url is required" });
  }

  try {
    const article = await fetchArticle(url);

    const dir = path.join(ANNOTATIONS_DIR, article.slug);
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

    fs.writeFileSync(
      path.join(dir, "source.md"),
      `${frontmatter}\n\n${article.content}\n`,
    );

    // Write empty annotations.yaml
    fs.writeFileSync(path.join(dir, "annotations.yaml"), "annotations: []\n");

    jsonResponse(res, 200, { slug: article.slug, title: article.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    jsonResponse(res, 500, { error: message });
  }
}

/**
 * POST /api/annotations/save
 * Body: { slug: string, annotations: Annotation[] }
 * Overwrites annotations.yaml with the provided array.
 */
async function handleSave(req: IncomingMessage, res: ServerResponse) {
  const body = JSON.parse(await parseBody(req));
  const { slug, annotations } = body;

  if (!slug || !Array.isArray(annotations)) {
    return jsonResponse(res, 400, {
      error: "slug and annotations[] are required",
    });
  }

  const yamlPath = path.join(ANNOTATIONS_DIR, slug, "annotations.yaml");
  if (!fs.existsSync(path.dirname(yamlPath))) {
    return jsonResponse(res, 404, { error: "Annotation directory not found" });
  }

  const yamlContent = yaml.dump(
    { annotations },
    { lineWidth: -1, quotingType: '"' },
  );
  fs.writeFileSync(yamlPath, yamlContent);

  jsonResponse(res, 200, { ok: true });
}

/**
 * POST /api/annotations/delete
 * Body: { slug: string, id: string }
 * Removes a single annotation by id from annotations.yaml.
 */
async function handleDelete(req: IncomingMessage, res: ServerResponse) {
  const body = JSON.parse(await parseBody(req));
  const { slug, id } = body;

  if (!slug || !id) {
    return jsonResponse(res, 400, { error: "slug and id are required" });
  }

  const yamlPath = path.join(ANNOTATIONS_DIR, slug, "annotations.yaml");
  if (!fs.existsSync(yamlPath)) {
    return jsonResponse(res, 404, { error: "annotations.yaml not found" });
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const parsed = yaml.load(yamlContent) as {
    annotations?: Annotation[];
  } | null;
  const current = parsed?.annotations ?? [];
  const filtered = current.filter((a) => a.id !== id);

  const newYaml = yaml.dump(
    { annotations: filtered },
    { lineWidth: -1, quotingType: '"' },
  );
  fs.writeFileSync(yamlPath, newYaml);

  jsonResponse(res, 200, { ok: true });
}

/**
 * Vite plugin that adds annotation API middleware during dev.
 * Does nothing during production builds.
 */
export function annotationApiPlugin() {
  return {
    name: "annotation-api",
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = req.url || "";

          if (url === "/api/annotations/create" && req.method === "POST") {
            return handleCreate(req, res);
          }
          if (url === "/api/annotations/save" && req.method === "POST") {
            return handleSave(req, res);
          }
          if (url === "/api/annotations/delete" && req.method === "POST") {
            return handleDelete(req, res);
          }

          next();
        },
      );
    },
  };
}
```

**Step 2: Wire the plugin into astro.config.mjs**

Modify `astro.config.mjs`:

```javascript
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { annotationApiPlugin } from "./src/lib/annotation-api";

export default defineConfig({
  site: "https://ffledgling.dev",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), annotationApiPlugin()],
  },
});
```

**Step 3: Verify build still passes**

```bash
npm run build
```

Expected: PASS (the plugin's `configureServer` only runs during dev, not build)

**Step 4: Verify spec tests still pass**

```bash
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All 21 tests PASS

**Step 5: Manual smoke test of the API**

```bash
# Start dev server
npm run dev &
sleep 3

# Test save endpoint
curl -X POST http://localhost:4321/api/annotations/save \
  -H "Content-Type: application/json" \
  -d '{"slug":"do-things-that-dont-scale","annotations":[{"id":"a1","anchor":"do things that don'\''t scale","type":"margin","note":"Test note"}]}'

# Should return {"ok":true}
# Kill dev server
kill %1
```

**Step 6: Restore annotations.yaml to original state if modified by smoke test**

```bash
git checkout -- src/content/annotations/do-things-that-dont-scale/annotations.yaml
```

**Step 7: Commit**

```bash
git add src/lib/annotation-api.ts astro.config.mjs
git commit -m "feat: add dev-only annotation API middleware via Vite plugin"
```

---

### Task 4: Markdown Rendering in Annotation Notes

Currently annotation notes render as plain text. Add markdown rendering so notes can contain links, images, bold, italic, etc.

**Files:**

- Create: `src/lib/render-markdown.ts`
- Create: `tests/unit/render-markdown.test.ts`
- Modify: `src/components/AnnotatedArticle.tsx`

**Step 1: Write the failing tests**

Create `tests/unit/render-markdown.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { renderAnnotationMarkdown } from "../../src/lib/render-markdown";

describe("renderAnnotationMarkdown", () => {
  it("renders plain text as-is (wrapped in <p>)", () => {
    const result = renderAnnotationMarkdown("Hello world");
    expect(result).toContain("Hello world");
  });

  it("renders bold text", () => {
    const result = renderAnnotationMarkdown("This is **bold** text");
    expect(result).toContain("<strong>bold</strong>");
  });

  it("renders links", () => {
    const result = renderAnnotationMarkdown("[YC](https://ycombinator.com)");
    expect(result).toContain('href="https://ycombinator.com"');
    expect(result).toContain("YC");
  });

  it("renders images", () => {
    const result = renderAnnotationMarkdown(
      "![alt text](https://example.com/img.png)",
    );
    expect(result).toContain("<img");
    expect(result).toContain('src="https://example.com/img.png"');
  });

  it("renders inline code", () => {
    const result = renderAnnotationMarkdown("Use `console.log` here");
    expect(result).toContain("<code>console.log</code>");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/unit/render-markdown.test.ts
```

Expected: FAIL (module not found)

**Step 3: Implement the render function**

Create `src/lib/render-markdown.ts`:

```typescript
import { marked } from "marked";

/**
 * Render a markdown string to HTML for use in annotation notes.
 * Links open in new tabs. Output is synchronous (marked supports sync).
 */
export function renderAnnotationMarkdown(markdown: string): string {
  const renderer = new marked.Renderer();

  // Make links open in new tabs
  renderer.link = ({ href, text }) => {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">${text}</a>`;
  };

  // Add styling to images
  renderer.image = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${title}"` : "";
    return `<img src="${href}" alt="${text}"${titleAttr} class="rounded mt-2 mb-2 max-w-full" />`;
  };

  return marked.parse(markdown, { renderer, async: false }) as string;
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test -- tests/unit/render-markdown.test.ts
```

Expected: All tests PASS

**Step 5: Update AnnotatedArticle.tsx to render markdown in notes**

In `src/components/AnnotatedArticle.tsx`, add a `MarkdownNote` helper component and use it everywhere `annotation.note` is currently rendered as plain text.

Import the render function at the top:

```typescript
import { renderAnnotationMarkdown } from "../lib/render-markdown";
```

Add a helper component:

```tsx
function MarkdownNote({ content }: { content: string }) {
  const html = renderAnnotationMarkdown(content);
  return (
    <span
      className="annotation-note-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

Replace these three occurrences of raw `annotation.note`:

1. **MarginNote** (line 41): Replace `{annotation.note}` with `<MarkdownNote content={annotation.note} />`

2. **MobilePopover** (line 59): Replace `{annotation.note}` with `<MarkdownNote content={annotation.note} />`

3. **Inline block** (line 108-109): Replace `{segment.annotation.note}` with `<MarkdownNote content={segment.annotation.note} />`

**Step 6: Verify build passes**

```bash
npm run build
```

**Step 7: Verify spec tests still pass**

```bash
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All 21 tests PASS (markdown rendering of plain text notes should produce the same visible output)

**Step 8: Commit**

```bash
git add src/lib/render-markdown.ts tests/unit/render-markdown.test.ts src/components/AnnotatedArticle.tsx
git commit -m "feat: render markdown in annotation notes (links, images, bold)"
```

---

### Task 5: Update CLI Script to Use Defuddle

Update `scripts/annotate.ts` to use the new `fetchArticle` function instead of the removed Readability + linkedom.

**Files:**

- Modify: `scripts/annotate.ts`

**Step 1: Rewrite the script**

Replace the contents of `scripts/annotate.ts`:

```typescript
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
```

**Step 2: Verify build still passes**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add scripts/annotate.ts
git commit -m "refactor: update annotate CLI to use Defuddle via article-fetcher"
```

---

### Task 6: Edit Mode Toggle & Text Selection

Add the core edit mode infrastructure to the AnnotatedArticle React component: a toggle button, text selection detection, and the devMode prop.

**Files:**

- Modify: `src/components/AnnotatedArticle.tsx`
- Modify: `src/pages/annotations/[...slug].astro`

**Step 1: Add devMode prop to [...slug].astro**

In `src/pages/annotations/[...slug].astro`, change the AnnotatedArticle usage (around line 101-105) to pass devMode and slug:

```astro
<AnnotatedArticle
  client:load
  sourceHtml={sourceBody}
  annotations={annotations}
  devMode={import.meta.env.DEV}
  slug={slug}
/>
```

**Step 2: Update the Props interface and top-level component in AnnotatedArticle.tsx**

Update the `Props` interface:

```typescript
interface Props {
  sourceHtml: string;
  annotations: Annotation[];
  devMode?: boolean;
  slug?: string;
}
```

Update the `AnnotatedArticle` default export to accept new props and add edit mode state:

```tsx
export default function AnnotatedArticle({
  sourceHtml,
  annotations: initialAnnotations,
  devMode = false,
  slug = "",
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [annotations, setAnnotations] =
    useState<Annotation[]>(initialAnnotations);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);

  // Handle text selection in edit mode
  useEffect(() => {
    if (!editMode) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }

      const text = selection.toString().trim();
      if (text.length > 0) {
        setSelectedText(text);
        setSelectionRange(selection.getRangeAt(0));
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [editMode]);

  const paragraphs = sourceHtml
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="annotated-article relative">
      {devMode && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setEditMode(!editMode);
              setSelectedText(null);
            }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              editMode
                ? "bg-accent text-white"
                : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600"
            }`}
          >
            {editMode ? "✏ Editing" : "✏ Edit Mode"}
          </button>
        </div>
      )}

      {paragraphs.map((para, i) => (
        <AnnotatedParagraph
          key={i}
          paragraphHtml={para}
          annotations={annotations}
          editMode={editMode}
        />
      ))}

      {/* Annotation form popover — added in Task 7 */}
    </div>
  );
}
```

**Step 3: Thread editMode through to AnnotatedParagraph and HighlightedText**

Update `AnnotatedParagraph` to accept and pass `editMode`:

```tsx
function AnnotatedParagraph({
  paragraphHtml,
  annotations,
  editMode,
}: {
  paragraphHtml: string;
  annotations: Annotation[];
  editMode: boolean;
}) {
  const segments = buildAnnotatedSegments(paragraphHtml, annotations);

  return (
    <div className="mb-4 relative leading-relaxed text-lg">
      {segments.map((segment, i) =>
        segment.type === "text" ? (
          <span key={i}>{segment.content}</span>
        ) : (
          <HighlightedText
            key={i}
            segment={segment as AnnotatedSegment & { type: "highlight" }}
            editMode={editMode}
          />
        ),
      )}
    </div>
  );
}
```

Update `HighlightedText` to accept `editMode` (the edit/delete buttons will be added in Task 8):

```tsx
function HighlightedText({
  segment,
  editMode,
}: {
  segment: AnnotatedSegment & { type: "highlight" };
  editMode: boolean;
}) {
  // ... existing implementation, editMode used in Task 8
```

**Step 4: Verify build passes**

```bash
npm run build
```

**Step 5: Verify spec tests still pass**

```bash
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All 21 tests PASS (devMode defaults to false in production builds, so no visible changes)

**Step 6: Commit**

```bash
git add src/components/AnnotatedArticle.tsx src/pages/annotations/[...slug].astro
git commit -m "feat: add edit mode toggle and text selection to AnnotatedArticle"
```

---

### Task 7: Annotation Form Popover

The popover that appears when text is selected in edit mode, allowing the user to create a new annotation.

**Files:**

- Create: `src/components/AnnotationForm.tsx`
- Modify: `src/components/AnnotatedArticle.tsx`

**Step 1: Create the AnnotationForm component**

Create `src/components/AnnotationForm.tsx`:

```tsx
import { useState } from "react";
import type { Annotation } from "../lib/annotations";

interface Props {
  /** The selected text that will become the anchor */
  selectedText: string;
  /** Pre-filled data when editing an existing annotation */
  existingAnnotation?: Annotation;
  /** Called when the user saves */
  onSave: (annotation: Omit<Annotation, "id"> & { id?: string }) => void;
  /** Called when the user cancels */
  onCancel: () => void;
}

export default function AnnotationForm({
  selectedText,
  existingAnnotation,
  onSave,
  onCancel,
}: Props) {
  const [type, setType] = useState<"margin" | "inline">(
    existingAnnotation?.type ?? "margin",
  );
  const [note, setNote] = useState(existingAnnotation?.note ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    onSave({
      id: existingAnnotation?.id,
      anchor: selectedText,
      startContext: existingAnnotation?.startContext,
      type,
      note: note.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 p-5 w-full max-w-md mx-4"
      >
        <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
          {existingAnnotation ? "Edit Annotation" : "New Annotation"}
        </div>

        <div className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-3 py-2 mb-4 font-medium text-stone-800 dark:text-stone-200">
          "
          {selectedText.length > 100
            ? selectedText.slice(0, 100) + "…"
            : selectedText}
          "
        </div>

        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Type
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="type"
                value="margin"
                checked={type === "margin"}
                onChange={() => setType("margin")}
                className="accent-accent"
              />
              <span>Margin</span>
              <span className="text-xs text-stone-400">(short note)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="type"
                value="inline"
                checked={type === "inline"}
                onChange={() => setType("inline")}
                className="accent-accent"
              />
              <span>Inline</span>
              <span className="text-xs text-stone-400">(longer block)</span>
            </label>
          </div>
        </fieldset>

        <div className="mb-4">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your commentary... (supports markdown: **bold**, [links](url), ![images](url))"
            rows={type === "inline" ? 6 : 3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y"
            autoFocus
          />
          <div className="text-xs text-stone-400 mt-1">
            Markdown: **bold**, *italic*, [link](url), ![image](url), `code`
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!note.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {existingAnnotation ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Step 2: Wire the form into AnnotatedArticle.tsx**

Import at the top of `AnnotatedArticle.tsx`:

```typescript
import AnnotationForm from "./AnnotationForm";
```

Add a save handler function inside the `AnnotatedArticle` component (after the state declarations):

```typescript
const saveAnnotations = async (updated: Annotation[]) => {
  setAnnotations(updated);
  if (!slug) return;
  try {
    await fetch("/api/annotations/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, annotations: updated }),
    });
  } catch (err) {
    console.error("Failed to save annotations:", err);
  }
};

const handleNewAnnotation = (
  data: Omit<Annotation, "id"> & { id?: string },
) => {
  const id = data.id || `a${Date.now()}`;
  const newAnnotation: Annotation = { ...data, id };
  const updated = [...annotations, newAnnotation];
  saveAnnotations(updated);
  setSelectedText(null);
  setSelectionRange(null);
};
```

Add the form rendering after the paragraphs, inside the `annotated-article` div:

```tsx
{
  selectedText && editMode && (
    <AnnotationForm
      selectedText={selectedText}
      onSave={handleNewAnnotation}
      onCancel={() => {
        setSelectedText(null);
        setSelectionRange(null);
      }}
    />
  );
}
```

**Step 3: Verify build passes**

```bash
npm run build
```

**Step 4: Verify spec tests still pass**

```bash
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All 21 tests PASS

**Step 5: Commit**

```bash
git add src/components/AnnotationForm.tsx src/components/AnnotatedArticle.tsx
git commit -m "feat: add annotation form popover for creating annotations"
```

---

### Task 8: Edit/Delete Existing Annotations

Add edit (✎) and delete (✕) buttons to highlights when in edit mode.

**Files:**

- Modify: `src/components/AnnotatedArticle.tsx`

**Step 1: Add edit/delete callbacks to the component props chain**

Add these state variables and handlers to the `AnnotatedArticle` component:

```typescript
const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(
  null,
);

const handleEditAnnotation = (
  data: Omit<Annotation, "id"> & { id?: string },
) => {
  if (!data.id) return;
  const updated = annotations.map((a) =>
    a.id === data.id ? { ...a, type: data.type, note: data.note } : a,
  );
  saveAnnotations(updated);
  setEditingAnnotation(null);
};

const handleDeleteAnnotation = (id: string) => {
  if (!confirm("Delete this annotation?")) return;
  const updated = annotations.filter((a) => a.id !== id);
  saveAnnotations(updated);

  // Also call the delete endpoint
  if (slug) {
    fetch("/api/annotations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, id }),
    }).catch(console.error);
  }
};
```

Pass callbacks through `AnnotatedParagraph` to `HighlightedText`:

```tsx
<AnnotatedParagraph
  key={i}
  paragraphHtml={para}
  annotations={annotations}
  editMode={editMode}
  onEdit={setEditingAnnotation}
  onDelete={handleDeleteAnnotation}
/>
```

Update `AnnotatedParagraph` to pass them through:

```tsx
function AnnotatedParagraph({
  paragraphHtml,
  annotations,
  editMode,
  onEdit,
  onDelete,
}: {
  paragraphHtml: string;
  annotations: Annotation[];
  editMode: boolean;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (id: string) => void;
}) {
```

And pass to `HighlightedText`:

```tsx
<HighlightedText
  key={i}
  segment={segment as AnnotatedSegment & { type: "highlight" }}
  editMode={editMode}
  onEdit={onEdit}
  onDelete={onDelete}
/>
```

**Step 2: Add edit/delete buttons to HighlightedText**

Update the `HighlightedText` component to show buttons in edit mode:

```tsx
function HighlightedText({
  segment,
  editMode,
  onEdit,
  onDelete,
}: {
  segment: AnnotatedSegment & { type: "highlight" };
  editMode: boolean;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (id: string) => void;
}) {
  const [showPopover, setShowPopover] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);

  if (!segment.annotation) return <>{segment.content}</>;

  return (
    <>
      <span className="relative inline">
        <mark
          ref={anchorRef}
          className="bg-amber-100 dark:bg-amber-900/40 text-inherit cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors rounded-sm px-0.5 -mx-0.5 relative"
          onClick={() => {
            if (!editMode) setShowPopover(!showPopover);
          }}
          role="button"
          tabIndex={0}
          aria-label={`Annotation: ${segment.annotation.note.slice(0, 50)}...`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (!editMode) setShowPopover(!showPopover);
            }
          }}
        >
          {segment.content}
        </mark>
        {editMode && segment.annotation && (
          <span className="inline-flex gap-0.5 ml-1 align-middle">
            <button
              onClick={() => onEdit?.(segment.annotation!)}
              className="inline-flex items-center justify-center w-5 h-5 text-xs rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-accent hover:text-white transition-colors"
              title="Edit annotation"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete?.(segment.annotation!.id)}
              className="inline-flex items-center justify-center w-5 h-5 text-xs rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-red-500 hover:text-white transition-colors"
              title="Delete annotation"
            >
              ✕
            </button>
          </span>
        )}
      </span>
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
          <MarkdownNote content={segment.annotation.note} />
        </div>
      )}
    </>
  );
}
```

**Step 3: Add the editing form rendering**

In the `AnnotatedArticle` return, after the selectedText form, add the editing form:

```tsx
{
  editingAnnotation && editMode && (
    <AnnotationForm
      selectedText={editingAnnotation.anchor}
      existingAnnotation={editingAnnotation}
      onSave={handleEditAnnotation}
      onCancel={() => setEditingAnnotation(null)}
    />
  );
}
```

**Step 4: Verify build passes**

```bash
npm run build
```

**Step 5: Verify spec tests still pass**

```bash
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All 21 tests PASS (edit mode is off by default in production)

**Step 6: Commit**

```bash
git add src/components/AnnotatedArticle.tsx
git commit -m "feat: add edit/delete buttons for existing annotations in edit mode"
```

---

### Task 9: New Article Form on Listing Page

Add a URL input form to the annotations listing page (dev-only) for creating new annotated articles from the browser.

**Files:**

- Create: `src/components/NewArticleForm.tsx`
- Modify: `src/pages/annotations/index.astro`

**Step 1: Create the NewArticleForm component**

Create `src/components/NewArticleForm.tsx`:

```tsx
import { useState } from "react";

export default function NewArticleForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/annotations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create article");
      }

      // Redirect to the new article with edit mode
      window.location.href = `/annotations/${data.slug}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-10 p-4 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/30"
    >
      <div className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
        + New Article
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          required
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Fetching…" : "Fetch & Create"}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}
    </form>
  );
}
```

**Step 2: Add the form to annotations/index.astro**

In `src/pages/annotations/index.astro`, add the import and render the form conditionally:

Add the import at the top of the frontmatter:

```typescript
import NewArticleForm from "../../components/NewArticleForm";
```

Add the form after the `<p>` description and before the article list, wrapped in a dev check:

```astro
{import.meta.env.DEV && <NewArticleForm client:load />}
```

**Step 3: Verify build passes**

```bash
npm run build
```

Expected: PASS (`import.meta.env.DEV` is false during build, so the form is excluded)

**Step 4: Verify spec tests still pass**

```bash
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All 21 tests PASS

**Step 5: Commit**

```bash
git add src/components/NewArticleForm.tsx src/pages/annotations/index.astro
git commit -m "feat: add New Article form to annotations listing page (dev-only)"
```

---

### Task 10: E2E Tests & Final Verification

Enable the skipped spec test sections and add tests for the authoring UI. Run the full test suite. Visually verify with Playwright.

**Files:**

- Modify: `tests/e2e/annotations-spec.test.ts`

**Step 1: Add a markdown-in-notes annotation to the sample data**

Add one annotation with markdown to `src/content/annotations/do-things-that-dont-scale/annotations.yaml`:

```yaml
- id: "a6"
  anchor: "compound growth"
  startContext: "power of"
  type: "margin"
  note: "See [Paul Graham's essay on growth](http://paulgraham.com/growth.html) for more."
```

**Step 2: Enable and flesh out the markdown spec tests**

In `tests/e2e/annotations-spec.test.ts`, replace the skipped Section 6 with:

```typescript
test.describe("Annotation rendering — markdown in notes", () => {
  test("renders markdown links as clickable HTML in margin notes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/annotations/do-things-that-dont-scale");

    // The a6 margin note contains a markdown link
    const link = page.locator(".annotation-note-content a", {
      hasText: "Paul Graham's essay on growth",
    });
    await expect(link.first()).toBeVisible();
    await expect(link.first()).toHaveAttribute(
      "href",
      "http://paulgraham.com/growth.html",
    );
  });
});
```

**Step 3: Run the full test suite**

```bash
npm run test
npm run build
npx playwright test tests/e2e/annotations-spec.test.ts
```

Expected: All unit tests PASS. All spec tests PASS.

**Step 4: Run lint and format**

```bash
npm run lint:fix
```

**Step 5: Visual verification with Playwright**

Start the dev server and use Playwright to visually verify:

1. `/annotations` — listing page shows, New Article form appears
2. `/annotations/do-things-that-dont-scale` — highlights visible, Edit Mode button visible
3. Click Edit Mode — toggle activates
4. Select text — annotation form appears
5. Margin notes show rendered markdown links

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "test: add markdown rendering spec tests and final polish"
```

**Step 7: Run the full existing test suite one final time**

```bash
npm run test
npx playwright test
```

Expected: All tests PASS (including the original `tests/e2e/annotations.spec.ts` alongside the new spec tests).
