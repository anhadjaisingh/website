---
name: manage-drafts
description: List, publish, or unpublish blog posts and annotated readings. Use when asked to publish, unpublish, list drafts, or manage draft state.
---

# Manage Drafts

List, publish, or unpublish content (blog posts and annotated readings).

## Commands

### List drafts

Find all content with `draft: true`:

1. Search blog posts:
   ```bash
   grep -l "draft: true" src/content/blog/*.md
   ```
2. Search annotations:
   ```bash
   grep -rl "draft: true" src/content/annotations/*/source.md
   ```
3. For each match, read the frontmatter and display:
   - Type (blog / annotation)
   - Title
   - Date
   - File path

### Publish

Set `draft: false` (or remove the `draft` line) in the target file's frontmatter.

1. Find the file:
   - Blog: `src/content/blog/{slug}.md`
   - Annotation: `src/content/annotations/{slug}/source.md`
2. Edit the frontmatter: change `draft: true` to `draft: false`
3. Commit:

   ```bash
   git add {file}
   git commit -m 'content({scope}): publish "{title}"

   Co-Authored-By: Claude <noreply@anthropic.com>'
   ```

### Unpublish

Set `draft: true` in the target file's frontmatter.

1. Find the file (same as publish)
2. Edit the frontmatter: change `draft: false` to `draft: true`
3. Commit:

   ```bash
   git add {file}
   git commit -m 'content({scope}): unpublish "{title}"

   Co-Authored-By: Claude <noreply@anthropic.com>'
   ```

**Scope** is `blog` or `annotations` depending on the content type.

## Notes

- Always confirm with the user before publishing (going live on the website)
- Unpublishing removes the page from the production site on next deploy
- In dev mode (`npm run dev`), drafts are still visible with a "Draft" badge
