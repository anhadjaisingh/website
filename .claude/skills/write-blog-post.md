---
name: write-blog-post
description: Create a new blog post as a draft. Use when asked to write, draft, or create a blog post.
---

# Write Blog Post

Create a new blog post in this Astro website.

## Inputs

- **Topic/title**: What the post is about (from user prompt or ask)
- **Tags**: Relevant tags (infer from topic, confirm with user)

## Process

### 1. Determine title and slug

Ask the user for a topic if not provided. Generate a slug:

- Lowercase the title
- Strip apostrophes and smart quotes (keep contractions together)
- Replace non-alphanumeric characters with hyphens
- Remove leading/trailing hyphens

Example: "I Asked Claude Code to Investigate" → `i-asked-claude-code-to-investigate`

### 2. Create the file

Create `src/content/blog/{slug}.md` with this frontmatter:

```yaml
---
title: "{title}"
description: "{1-2 sentence description}"
date: { YYYY-MM-DD }
tags: [{ comma-separated tags }]
draft: true
---
```

**Frontmatter rules:**

- `title`: Sentence case, in quotes
- `description`: Brief summary, in quotes
- `date`: Today's date in YYYY-MM-DD format
- `tags`: Array of lowercase kebab-case strings. Check existing tags first: `grep -r "tags:" src/content/blog/ | sort -u` to stay consistent
- `draft`: Always `true` for new posts — publish later via `manage-drafts` skill

### 3. Write the content

Write the full post in markdown below the frontmatter. Follow these conventions:

- Use `##` for major sections (h2), `###` for subsections (h3)
- Use fenced code blocks with language tags for code
- Keep paragraphs focused — one idea per paragraph
- No trailing whitespace, single blank line between sections
- Do not add a `# Title` heading — the layout adds it from frontmatter

### 4. Commit

```bash
git add src/content/blog/{slug}.md
git commit -m 'content(blog): create draft "{title}"

Co-Authored-By: Claude <noreply@anthropic.com>'
```

Stage only the new file. Never use `git add -A`. Never push.
