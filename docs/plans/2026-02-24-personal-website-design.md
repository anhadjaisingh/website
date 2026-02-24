# Personal Website Design — ffledgling.dev

**Date:** 2026-02-24
**Status:** Approved

## Overview

A personal website for Anhad Jai Singh at ffledgling.dev (with anhadjaisingh.com redirecting to it). The site serves as a personal home — resume, blog, projects, social links — reflecting a broad range of interests beyond just software development.

## Prior Art

Two previous website iterations inform this design:

- **ffledgling.com (main site):** Bootstrap + Flat UI, clean minimal layout, teal accent color. Photo + short bio. Not carrying this aesthetic forward — feels dated.
- **blog.ffledgling.com:** Jekyll with WordPress Ryu theme. Playfair Display serif headings, Lato sans-serif body, generous whitespace, clean post listing with metadata (date, word count, tags, excerpt). Taking strong cues from this aesthetic.
- **27 existing blog posts** (2013-2018) in a [Jekyll repo](https://github.com/ffledgling/blog) to be migrated, plus 1 new post already in this repo.

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Astro v5 | Content-first SSG, markdown workflow, islands architecture for interactive features |
| Styling | Tailwind CSS v4 | Utility-first, easy to customize, configurable design tokens |
| Content | Astro Content Collections | Typed frontmatter schemas, markdown/MDX support |
| Interactive islands | React | For future annotation feature, demos, embedded widgets |
| Hosting | Cloudflare Pages | Free tier, auto-deploy on git push, custom domains, first-party Astro integration |
| Testing | Vitest (unit) + Playwright (E2E) | Native Astro integration, comprehensive coverage |
| CI/CD | GitHub Actions | Lint, type check, test, build, deploy pipeline |
| Code quality | ESLint + Prettier + Husky | Pre-commit hooks via lint-staged |
| Language | TypeScript (strict) | Throughout the project |

## Project Structure

```
/
├── src/
│   ├── content/            # All content lives here (git-backed markdown)
│   │   ├── blog/           # Blog posts (.md/.mdx)
│   │   └── projects/       # Project descriptions (.md)
│   ├── layouts/            # Page layouts
│   │   ├── BaseLayout.astro
│   │   └── BlogPostLayout.astro
│   ├── pages/              # Routes
│   │   ├── index.astro              # Home
│   │   ├── about.astro              # Resume/About
│   │   ├── blog/
│   │   │   ├── index.astro          # Blog listing
│   │   │   └── [...slug].astro      # Individual posts
│   │   ├── projects.astro           # Projects showcase
│   │   ├── links.astro              # Social links
│   │   └── contact.astro            # Contact
│   ├── components/         # Reusable UI components
│   └── styles/             # Global styles, font imports, CSS custom properties
├── public/                 # Static assets (images, resume PDF, favicon)
├── docs/                   # Project documentation
│   ├── publishing-workflow.md
│   └── architecture.md
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
├── CLAUDE.md               # Agent/developer guidelines
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

## Publishing Workflow

1. Create a new `.md` file in `src/content/blog/` with frontmatter (title, date, tags, description)
2. Write content in markdown (or MDX for posts needing embedded components)
3. `git commit && git push` — Cloudflare Pages auto-builds and deploys
4. For interactive/rich content: use MDX and import React/Svelte components inline

## Visual Design

### Typography
- **Headings:** Serif typeface (Playfair Display, Lora, or Source Serif Pro) — carries forward the old blog's gravitas
- **Body:** Clean sans-serif (Inter or Lato) — excellent readability
- **Code:** Monospace with ligatures (JetBrains Mono or Fira Code)
- All font choices configurable via Tailwind theme / CSS custom properties

### Color Palette
- **Background:** Warm off-white (`#fafaf9` range)
- **Text:** Warm near-black (`#1c1917` range)
- **Accent:** Single muted color, used sparingly (links, hover states, active nav) — exact hue TBD
- **Metadata:** Subtle grays for dates, tags, word counts
- **Dark mode:** Full dark palette, togglable
- All colors configurable via CSS custom properties / Tailwind config

### Layout
- Content max-width ~720px for prose (optimal reading line length)
- Generous whitespace
- Single-column for posts, wider layout for home/projects
- Top nav: site name/logo left, page links right, sticky on scroll
- Mobile-first responsive design

## Pages

### Home
- Name prominently displayed (refined, not oversized)
- One-line tagline (to be wordsmithed — updated from "I code. Sometimes.")
- Brief intro paragraph
- Recent blog posts (3-5): title, date, tags
- Quick links to projects, social profiles

### Blog Listing
- Posts sorted newest-first
- Each entry: title, date, word count, tags, short excerpt
- Filterable by tag (client-side, no heavy JS)

### Blog Post
- Clean reading layout with good line spacing
- Top metadata: date, word count, tags
- Auto-generated table of contents for longer posts
- Syntax highlighting via Shiki (built into Astro)
- Previous/next post navigation at bottom

### About/Resume
- Prose-style about section with personality
- Current role and interests
- Career highlights (not a full CV — link to downloadable PDF)
- Skills presented casually
- Online presence links

### Projects
- Card grid layout: name, one-line description, tech tags, repo/demo link
- Content-driven: each project is a markdown file in `src/content/projects/`

### Links
- Social profiles list (GitHub, LinkedIn, X/Twitter, etc.)
- Doubles as a "link in bio" page

### Contact
- Email / mailto link
- Links to where reachable
- No contact form (avoids spam and backend needs)

## Engineering Standards

### Testing Requirements
- **Unit tests (Vitest):** Utility functions, content schema validation, component logic
- **E2E tests (Playwright):** Page rendering, navigation, blog post display, responsive layouts
- Tests run on every PR via GitHub Actions

### CI/CD Pipeline (GitHub Actions)
1. Lint (ESLint + Prettier check)
2. Type check (TypeScript)
3. Unit tests (Vitest)
4. Build (catch broken builds)
5. E2E tests (Playwright)
6. Deploy to Cloudflare Pages (on main branch push)

### Code Quality
- ESLint with Astro plugin
- Prettier for formatting
- Pre-commit hooks via Husky + lint-staged (lint + format on staged files)
- TypeScript strict mode throughout

### Documentation
- `docs/publishing-workflow.md` — how to create posts, add projects, deploy
- `docs/architecture.md` — tech stack decisions, project structure, conventions
- `CLAUDE.md` — coding guidelines, testing requirements, doc references

## Content Migration

- Port 27 blog posts from [ffledgling/blog](https://github.com/ffledgling/blog) Jekyll repo
- Clean up WordPress-era frontmatter to match new Astro content collection schema
- Port existing `blog/claude-code-investigating-itself.md` from this repo
- Preserve original publication dates

## Future Work (Phase 2 — Not in Scope for v1)

- **Annotated reader:** Highlight text in existing articles/pages with margin annotations. Annotations stored in sidecar data files (JSON/YAML). Built as a React island component.
- **Interactive demos:** Embedded software features / website snippets within blog posts via MDX
- **RSS feed**
- **Search**
