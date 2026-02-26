# ffledgling.dev

Personal website of Anhad Jai Singh. Built with Astro, Tailwind CSS, and deployed on Cloudflare Pages.

## Setup

```bash
npm install
npx playwright install chromium  # needed for annotation fetching
```

## Development

```bash
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview production build
npm run lint      # eslint + prettier check
npm run format    # prettier format
npm test          # vitest unit tests
npm run test:e2e  # playwright e2e tests
npm run test:all  # both unit + e2e
```

## Annotations

The annotation feature lets you publish annotated readings of external articles. Articles are fetched, snapshotted as markdown, and stored with a YAML sidecar containing your annotations. The production site renders them as static pages with highlighted text and margin notes.

Authoring is local-only — the editing UI and API endpoints only exist on the dev server.

### Adding a new article

1. Start the dev server: `npm run dev`
2. Go to `/annotations` in your browser
3. Paste a URL into the "New Article" form and submit
4. The article is fetched (via Playwright + Defuddle), and you're redirected to it

Or use the CLI:

```bash
npm run annotate -- <url>
```

Both create two files in `src/content/annotations/<slug>/`:

- `source.md` — article content with frontmatter
- `annotations.yaml` — annotation definitions (starts empty)

### Annotating an article

1. Open the article page on the dev server (e.g. `/annotations/do-things-that-dont-scale`)
2. Click **Edit Annotations** to enter edit mode
3. Select text in the article to highlight it
4. Choose annotation type:
   - **Margin note** — short note in the right margin (desktop) or popover (mobile)
   - **Inline note** — longer commentary shown as a block when the highlight is clicked
5. Write your note (markdown supported — links, bold, italic, code, images)
6. Click **Add Annotation** — it saves automatically to `annotations.yaml`

To edit or delete existing annotations, enter edit mode and use the blue/red buttons on each highlight.

### Publishing

Commit the `source.md` and `annotations.yaml` files, push, and Cloudflare builds the static site with your annotations baked in.

### Data model

```
src/content/annotations/
  <slug>/
    source.md           # article content + frontmatter (title, author, sourceUrl, etc.)
    annotations.yaml    # array of { id, anchor, type, note }
```
