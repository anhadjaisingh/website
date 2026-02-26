# Content Management Skills for Claude Code & Cowork

## Problem

Managing blog posts and annotated readings requires multiple manual steps: creating files with correct frontmatter, fetching articles, writing annotations in YAML, toggling draft state, proofreading, and committing changes. There's no structured way for Claude (via CLI or Cowork) to assist with these workflows, and no way to distinguish human-authored content changes from Claude-authored ones in git history.

## Design

Five Claude Code skills in `.claude/skills/`, each a self-contained markdown file describing a content workflow. Skills use existing tools (Read, Write, Edit, Bash, WebSearch) — no MCP server needed since all operations are local file manipulation.

### Skills

| Skill                      | Trigger                          | Purpose                                                    |
| -------------------------- | -------------------------------- | ---------------------------------------------------------- |
| `write-blog-post`          | "write a blog post about X"      | Create new blog post as draft                              |
| `create-annotated-reading` | "annotate this article: \<url\>" | Fetch article, set up files, add annotations               |
| `manage-drafts`            | "publish X" / "list drafts"      | Toggle draft state, list drafts                            |
| `review-content`           | "review/spell-check X"           | Proofread, fix typos, check links                          |
| `enrich-content`           | "add diagrams/references to X"   | Research and add supporting material (user-initiated only) |

### Skill Details

#### `write-blog-post`

1. Ask for topic/title (or accept from prompt)
2. Generate slug from title (lowercase, hyphens, strip special chars)
3. Create `src/content/blog/{slug}.md` with frontmatter: title, description, date, tags, `draft: true`
4. Draft the full post content in markdown
5. Commit with structured message

#### `create-annotated-reading`

1. Accept a URL
2. Run `npx tsx scripts/fetch-article.ts <url>` to fetch article (Playwright + Defuddle)
3. Verify generated `source.md` (title, author, content)
4. Read source text, identify passages worth annotating
5. Write annotations to `annotations.yaml` (id, anchor, startContext, type, note)
6. Commit with structured message

#### `manage-drafts`

- **List**: Glob all blog + annotation content, read frontmatter, filter `draft: true`
- **Publish**: Set `draft: false` in frontmatter, commit
- **Unpublish**: Set `draft: true` in frontmatter, commit

#### `review-content`

1. Read target content file
2. Check: spelling, grammar, broken markdown, incomplete frontmatter, broken links
3. Present findings to user, apply approved fixes
4. Commit with structured message

#### `enrich-content`

1. Read existing content
2. Based on explicit user request: research, find references, create diagrams, add citations
3. Edit content to weave in enrichments
4. Commit with structured message

**Constraint:** `enrich-content` is strictly opt-in. Claude may recommend enrichment but must never act without explicit user consent.

### Git Provenance

Every skill ends with a git commit. Format:

```
content(<scope>): <action> "<title>"

<optional body with rationale>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Scopes:** `blog`, `annotations`, `review`, `enrich`

**Conventions:**

- Stage only specific content files changed (never `git add -A`)
- Never push — left to the user
- `Co-Authored-By` trailer distinguishes Claude commits from human edits
- `git log --author="Claude"` or `git log --grep="content("` to filter

### What doesn't change

- Content schemas (`src/content.config.ts`)
- Annotation rendering (`src/lib/annotations.ts`, `AnnotatedArticle.tsx`)
- Existing annotation API (dev-mode UI continues to work for manual authoring)
- Build/deploy pipeline
