---
name: create-annotated-reading
description: Fetch an article by URL and create an annotated reading with highlights and notes. Use when asked to annotate an article or create an annotated reading.
---

# Create Annotated Reading

Fetch an external article and create an annotated reading with margin and inline notes.

## Inputs

- **URL**: The article URL to annotate (required)
- **Focus areas**: What to pay attention to when annotating (optional — ask if not provided)

## Process

### 1. Fetch the article

Run the article fetcher script:

```bash
npx tsx scripts/fetch-article.ts "<url>"
```

This outputs JSON: `{ title, author, content, slug, sourceUrl }`

If the script fails (Playwright not installed, URL unreachable, etc.), tell the user and suggest:

```bash
npx playwright install chromium
```

### 2. Create the source file

Create `src/content/annotations/{slug}/source.md`:

```yaml
---
title: "{title}"
author: "{author}"
sourceUrl: "{url}"
snapshotDate: { YYYY-MM-DD }
description: "{1-2 sentence description of why this article is worth reading}"
tags: [{ relevant tags }]
draft: true
---
{ article content in markdown, as returned by the fetcher }
```

**Notes:**

- If the fetcher returned an empty author, ask the user or leave as empty string
- `snapshotDate` is today's date (when the article was fetched)
- `description` should be written from the user's perspective ("My annotated reading of...")
- `draft: true` always — publish later via `manage-drafts` skill

### 3. Read the article and identify passages to annotate

Read the full source text carefully. Look for:

- Key claims or arguments worth highlighting
- Surprising or counterintuitive statements
- Practical advice or actionable insights
- Passages that connect to other ideas
- Memorable phrases or framings

### 4. Write annotations

Create `src/content/annotations/{slug}/annotations.yaml`:

```yaml
annotations:
  - id: "a1"
    anchor: "exact text from the article"
    startContext: "preceding 20-30 chars"
    type: "margin"
    note: "Short observation or connection."

  - id: "a2"
    anchor: "another exact passage"
    startContext: "preceding text for disambiguation"
    type: "inline"
    note: "Longer commentary with analysis, personal experience, or connections to other ideas."
```

**Annotation rules:**

- `id`: Sequential `a1`, `a2`, `a3`, etc.
- `anchor`: Must be an EXACT substring of the source text. Copy-paste, don't rephrase. Keep to a phrase or sentence — not full paragraphs.
- `startContext`: The ~20-30 characters immediately before the anchor text in the source. Always include this for disambiguation. Omit only if the anchor is at the very start of the article.
- `type`:
  - `"margin"` — Short notes (1-2 sentences). Shown in the right margin on desktop, popover on mobile.
  - `"inline"` — Longer commentary (2+ sentences). Shown as an expandable block below the highlight.
- `note`: Markdown supported. Can include links, emphasis, code. Write from the reader's perspective — personal reactions, connections, critiques.

**Quality guidelines:**

- Aim for 5-15 annotations per article (depends on length)
- Mix of margin and inline — margin for quick reactions, inline for deeper analysis
- Don't annotate every paragraph — be selective
- Notes should add value beyond what the text already says

### 5. Verify anchors match

Read back the source text and confirm every `anchor` string appears exactly in the text. If any anchor doesn't match, fix it before committing.

### 6. Commit

```bash
git add "src/content/annotations/{slug}/source.md" "src/content/annotations/{slug}/annotations.yaml"
git commit -m 'content(annotations): create draft "{title}" with N annotations

Co-Authored-By: Claude <noreply@anthropic.com>'
```

Replace `N` with the actual annotation count. Stage only the two files. Never push.
