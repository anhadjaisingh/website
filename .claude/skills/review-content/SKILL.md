---
name: review-content
description: Review and spell-check blog posts or annotated readings. Use when asked to proofread, review, spell-check, or fix content.
---

# Review Content

Proofread and review blog posts or annotated readings for quality issues.

## Inputs

- **Target**: Which post or annotation to review (title, slug, or "all drafts")

## Process

### 1. Find and read the content

- Blog: `src/content/blog/{slug}.md`
- Annotation source: `src/content/annotations/{slug}/source.md`
- Annotation notes: `src/content/annotations/{slug}/annotations.yaml`

If the user says "all drafts", list drafts first (see `manage-drafts` skill), then review each.

### 2. Check for issues

**Frontmatter:**

- All required fields present (title, description, date, tags for blog; title, author, sourceUrl, snapshotDate, description, tags for annotations)
- Date format is YYYY-MM-DD
- Tags are lowercase kebab-case
- Description is present and meaningful (not placeholder text)

**Content (blog posts):**

- Spelling and grammar errors
- Broken markdown syntax (unclosed code blocks, malformed links)
- Inconsistent heading levels (should start at h2, not h1)
- Broken links (use WebFetch to verify external URLs if there are only a few; skip if many)
- Missing alt text on images
- Overly long paragraphs (suggest breaking up if > 5 sentences)

**Content (annotations):**

- All `anchor` strings actually appear in the source text
- `startContext` is present for disambiguation
- `id` values are unique and sequential
- `type` is either "margin" or "inline"
- Notes are substantive (not just "interesting" or "good point")
- Markdown in notes renders correctly

### 3. Present findings

List all issues found, grouped by severity:

- **Errors**: Broken anchors, missing required fields, invalid markdown
- **Warnings**: Missing startContext, missing description, broken links
- **Suggestions**: Typos, grammar, style improvements

Ask the user which fixes to apply.

### 4. Apply fixes

Edit files to fix approved issues. Do not change the substance or voice of the writing — only fix mechanical issues unless asked.

### 5. Commit

```bash
git add {changed files}
git commit -m 'content(review): fix issues in "{title}"

{brief summary of what was fixed}

Co-Authored-By: Claude <noreply@anthropic.com>'
```
