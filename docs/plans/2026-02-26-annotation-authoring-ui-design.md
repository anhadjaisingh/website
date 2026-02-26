# Annotation Authoring UI Design

**Date:** 2026-02-26
**Status:** Approved
**Supersedes:** The "Authoring Tool (v1)" and "Future Enhancements" sections of `2026-02-24-annotation-feature-design.md`

## Overview

A browser-based inline authoring UI for creating and editing annotated readings. Runs during local dev (`npm run dev`) only. The user provides a URL, the system fetches and snapshots the article, and the user annotates by selecting text directly on the rendered page.

## Problem

The v1 workflow requires manually copying text anchors into a YAML file — error-prone, tedious, and breaks the reading flow. Users should be able to read an article and annotate inline without leaving the browser.

## User Workflows

### Creating a new annotated article

1. Navigate to `/annotations` during local dev
2. A "New Article" form appears (dev-only) with a URL input
3. Paste a URL, click "Fetch & Create"
4. The system fetches the page with Playwright, extracts content with Defuddle, converts to markdown with Turndown
5. `source.md` + empty `annotations.yaml` are written to `src/content/annotations/<slug>/`
6. User is redirected to the new article's page with edit mode enabled

### Adding an annotation

1. Navigate to an annotation detail page, toggle "Edit Mode" (dev-only button, top-right)
2. Select any text in the article
3. A popover appears showing the selected text, with:
   - Type toggle: Margin / Inline
   - Note textarea (supports markdown — bold, links, images, etc.)
   - Save / Cancel buttons
4. On save, the annotation is auto-saved to `annotations.yaml`
5. HMR refreshes the page; the new highlight appears immediately

### Editing an existing annotation

1. In edit mode, hover over a highlighted passage
2. Small edit (✎) and delete (✕) buttons appear
3. Clicking edit opens the same popover, pre-filled with the existing note and type
4. On save, the annotation is updated in `annotations.yaml`

### Deleting an annotation

1. In edit mode, click the delete (✕) button on a highlight
2. A brief confirmation appears ("Delete this annotation?")
3. On confirm, the annotation is removed from `annotations.yaml`

## Content Extraction Pipeline

**Previous (v1):** `fetch HTML → Readability → Turndown → markdown`

**New (v2):** `Playwright renders page → Defuddle extracts content → Turndown → markdown`

### Why Defuddle over Readability

- More conservative extraction — preserves images, diagrams, tables, code blocks
- Standardizes footnotes, math (MathML), and code with language detection
- Built for Obsidian Web Clipper — same use case as ours
- npm package, runs locally, no external API dependency

### Why Playwright in the pipeline

Many articles are JS-rendered (SPAs, lazy-loaded content). Playwright renders the full page before Defuddle extracts, ensuring we capture everything.

## Technical Architecture

### Dev-only API Routes

Astro server endpoints, only active during `npm run dev`:

| Endpoint                  | Method | Body                                          | Purpose                                                                                                   |
| ------------------------- | ------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/api/annotations/create` | POST   | `{ url: string }`                             | Fetch URL → Playwright + Defuddle + Turndown → write `source.md` + `annotations.yaml` → return `{ slug }` |
| `/api/annotations/save`   | POST   | `{ slug: string, annotations: Annotation[] }` | Write full annotations array to `annotations.yaml`                                                        |
| `/api/annotations/delete` | DELETE | `{ slug: string, id: string }`                | Remove annotation by id from `annotations.yaml`                                                           |

### Astro Output Mode

Astro config needs `output: 'hybrid'` to support API routes during dev while keeping pages statically generated for production.

### React Component Changes

`AnnotatedArticle.tsx` gains:

- `devMode: boolean` prop (from `import.meta.env.DEV`)
- Edit mode toggle state
- `window.getSelection()` handler for text selection → popover
- Annotation form component (type toggle, markdown textarea, save/cancel)
- Edit/delete buttons on existing highlights (visible in edit mode on hover)
- Auto-save: calls `POST /api/annotations/save` on every mutation

### Markdown in Annotation Notes

Annotation notes support markdown syntax (links, images, bold, italic, code). Rendered using `marked` (lightweight markdown parser) in the React component wherever notes are displayed — margin notes, inline blocks, and mobile popovers.

### Page Changes

- `annotations/index.astro` — adds "New Article" URL form (dev-only, gated on `import.meta.env.DEV`)
- `annotations/[...slug].astro` — passes `devMode={import.meta.env.DEV}` to the React component

## Dependencies

### Add

| Package    | Purpose                                   |
| ---------- | ----------------------------------------- |
| `defuddle` | Content extraction (replaces Readability) |
| `marked`   | Markdown rendering in annotation notes    |

### Remove

| Package                | Reason                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| `@mozilla/readability` | Replaced by Defuddle                                                             |
| `linkedom`             | Defuddle has its own DOM handling; Playwright provides the real DOM for fetching |

### Keep

| Package            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `turndown`         | HTML → markdown conversion                     |
| `js-yaml`          | YAML read/write                                |
| `@playwright/test` | Already a dev dep; also used in fetch pipeline |

## Data Model

No changes to the data model from v1. The same `source.md` + `annotations.yaml` structure is used. The authoring UI simply provides a better interface for creating and editing these files.

## File Structure (new/modified files)

```
src/
├── pages/
│   └── api/
│       └── annotations/
│           ├── create.ts        # NEW: fetch URL, create source files
│           ├── save.ts          # NEW: write annotations.yaml
│           └── delete.ts        # NEW: remove annotation from yaml
├── components/
│   ├── AnnotatedArticle.tsx     # MODIFIED: add edit mode, selection, forms
│   └── AnnotationForm.tsx       # NEW: popover form component
├── lib/
│   ├── annotations.ts           # EXISTING: anchor matching (no changes)
│   └── article-fetcher.ts       # NEW: Playwright + Defuddle + Turndown pipeline
└── pages/
    └── annotations/
        ├── index.astro          # MODIFIED: add New Article form
        └── [...slug].astro      # MODIFIED: pass devMode prop
```

## Testing

### Unit Tests

- Anchor matching algorithm (existing — no changes)
- Markdown rendering in notes (new)

### E2E Tests (spec tests)

See `tests/e2e/annotations.spec.ts` — the existing tests serve as the **spec tests** for the annotation feature. They define the contract that must not break:

- Listing page renders with title, author, date
- Detail page renders with attribution header
- Highlights are visible as `<mark>` elements
- Clicking highlights shows annotation content
- Markdown in notes renders as HTML (links, images)

### Authoring UI E2E Tests (dev-mode only)

New tests that run against the dev server:

- Edit mode toggle appears and activates
- Text selection shows annotation popover
- Creating an annotation persists to YAML and appears on page
- Editing an annotation updates the note
- Deleting an annotation removes the highlight
- New Article form fetches URL and creates files

## Constraints

- **Dev-only:** The authoring UI and API routes must not appear in production builds
- **No external dependencies for saving:** All persistence is local filesystem via Node fs
- **Backward compatible:** Existing `annotations.yaml` files authored manually continue to work unchanged
- **Auto-save:** No explicit save step; every annotation mutation writes to disk immediately
