# Annotation Feature Design

**Date:** 2026-02-24
**Status:** Approved

## Overview

A feature for publishing annotated readings of external articles. The user reads an article, highlights passages, and writes commentary — published on ffledgling.dev as "my annotated reading of [article]" with clear attribution to the original source.

## Use Case

Primary: Annotating external articles (blog posts, essays, news pieces) with personal commentary. The source article is snapshotted (with attribution) so annotations survive if the original goes down.

## Data Model

Each annotated article is a directory in `src/content/annotations/`:

```
src/content/annotations/
└── paul-graham-do-things-that-dont-scale/
    ├── source.md          # Snapshotted article content (markdown)
    └── annotations.yaml   # Annotations (hand-editable)
```

### source.md

The article text as markdown with metadata frontmatter:

```yaml
---
title: "Do Things That Don't Scale"
author: "Paul Graham"
sourceUrl: "http://paulgraham.com/ds.html"
snapshotDate: 2026-03-01
description: "My annotated reading of Paul Graham's essay on doing unscalable things."
tags: ["startups", "paul-graham"]
---
The actual article content as markdown...
```

### annotations.yaml

Human-readable, hand-editable YAML:

```yaml
annotations:
  - id: "a1"
    anchor: "the most common unscalable thing founders have to do"
    type: "margin"
    note: "This resonates — every successful startup I've seen did this."

  - id: "a2"
    anchor: "Airbnb is the classic example"
    startContext: "actually went door to door"
    type: "inline"
    note: |
      This is a longer commentary that warrants its own block.

      The Airbnb story is often told but the details matter —
      they weren't just visiting hosts, they were professionally
      photographing apartments.
```

**Fields:**

- `id` — Unique identifier for the annotation
- `anchor` — Text substring to match in the source (for highlighting)
- `startContext` — Optional extra text to disambiguate duplicate anchors
- `type` — `"margin"` for short notes (displayed in margin) or `"inline"` for longer commentary (displayed as block below paragraph)
- `note` — The annotation text (supports markdown)

## Rendering

### Page: `/annotations/[slug]`

- **Attribution header:** Prominently displays "My annotated reading of [Title] by [Author]" with link to original URL and snapshot date
- **Source text:** Rendered as prose in the main content column (~720px)
- **Highlighted anchors:** Text matching annotation anchors is highlighted with a subtle background color
- **Margin notes (wide screens):** Short annotations appear in the right margin, positioned next to their anchor text. On screens too narrow for margins, they collapse to inline popovers/tooltips on click.
- **Inline notes:** Longer commentary rendered as a visually distinct block (different background, left border accent) below the paragraph containing the anchor.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  My annotated reading of "Article Title" by Author      │
│  Originally published at [link] · Snapshotted Feb 2026  │
├─────────────────────────────────────────────────────────┤
│                                          │              │
│  Article text flows here in the          │ Margin note  │
│  main column. ████highlighted████        │ appears here │
│  text is marked with background.         │ next to the  │
│                                          │ anchor.      │
│  More article text continues...          │              │
│                                          │              │
│  ┌─ Inline annotation ────────────────┐  │              │
│  │ Longer commentary appears as a     │  │              │
│  │ styled block after the paragraph.  │  │              │
│  └────────────────────────────────────┘  │              │
│                                          │              │
└─────────────────────────────────────────────────────────┘
```

### Mobile

On mobile (< ~1024px), there's no room for margin notes. They become:

- Highlighted text is still visible
- Clicking/tapping highlighted text reveals annotation in a popover or expands inline below

## Authoring Tool (v1)

A CLI helper script (`scripts/annotate.ts`) that:

1. Takes a URL as input
2. Fetches the article HTML
3. Extracts readable content (using Mozilla's Readability algorithm or similar)
4. Converts to markdown
5. Creates the directory structure with `source.md` (with frontmatter) and a starter `annotations.yaml`

The user then hand-edits `annotations.yaml` to add annotations. The nice browser-based authoring UI is a future enhancement.

```bash
npx tsx scripts/annotate.ts "http://paulgraham.com/ds.html"
# Creates src/content/annotations/do-things-that-dont-scale/source.md
# Creates src/content/annotations/do-things-that-dont-scale/annotations.yaml (empty starter)
```

## Technical Architecture

### Content Collection

New collection in `src/content.config.ts`:

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

### Annotation YAML Loading

At build time, the page template reads the sibling `annotations.yaml` file using Node fs (available in Astro frontmatter) and parses it.

### React Island Component

`AnnotatedArticle` React component (client:load) that:

1. Receives the source HTML and annotations array as props
2. Walks the text nodes, finds anchor matches, wraps them in highlight spans
3. Positions margin notes using CSS (absolute positioning relative to anchor)
4. Renders inline notes as blocks after the containing paragraph
5. Handles mobile fallback (popovers on tap)

### Pages

- `/annotations/` — Listing of all annotated articles
- `/annotations/[slug]` — Individual annotated article

### Annotations Listing Page

Similar to the blog listing: title, author, date, description, tags.

## Testing

- **Unit tests:** Anchor matching algorithm (finding text substrings, handling duplicates, startContext disambiguation)
- **E2E tests:** Annotation page renders, highlights are visible, margin notes appear on desktop, mobile popover works

## Future Enhancements (Not v1)

- Browser-based annotation UI (highlight text, type note in popover, auto-saves to YAML)
- Annotation count badges on listing page
- Shareable deep links to specific annotations
- RSS feed for annotated articles
