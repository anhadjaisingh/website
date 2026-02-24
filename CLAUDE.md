# Claude Code Project Instructions

## Workflow Rules

1. **Keep main loop free.** All coding and execution happens in sub-agents/background tasks.
2. **One task at a time.** Create a TODO list, implement each item sequentially.
3. **Branch + PR per task.** Each task gets its own branch and PR. Rebase against main before merging.
4. **Verify before pushing.** Use Playwright to visually verify changes before committing.
5. **Update the spec.** Design decisions go in `docs/design-spec.md`. Keep it current.

## Tech Stack

- **Framework:** Astro v5 with Content Collections (glob loader)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin, `@theme` directive)
- **Interactive components:** React islands (`client:load`)
- **Hosting:** Cloudflare Pages (git-push auto-deploy)
- **Fonts:** Literata (headings), Noto Sans (body/nav), JetBrains Mono (code)

## Key Files

- `src/styles/global.css` — Font imports, theme variables, base styles
- `src/layouts/BaseLayout.astro` — Root layout, head, body wrapper
- `src/layouts/BlogPostLayout.astro` — Blog post layout with prose styling
- `src/components/Header.astro` — Sticky nav with mobile menu
- `src/components/ThemeToggle.astro` — Dark/light mode toggle
- `src/components/Footer.astro` — Footer with built-with credits
- `docs/design-spec.md` — Canonical design decisions

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — ESLint check
- `npm run format` — Prettier format
- `npm test` — Run Vitest unit tests
