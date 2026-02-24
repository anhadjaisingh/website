# ffledgling.dev -- Pre-Launch Review & Demo

**Date:** 2026-02-24
**For:** Anhad (site owner)
**Format:** Quick walkthrough + stakeholder check-in before v1 launch

---

## 1. Demo Script

Walk through the site as a first-time visitor would experience it. All paths are relative to `https://ffledgling.dev`.

### Stop 1: Homepage (`/`)

The landing page introduces you as "Anhad Jai Singh -- Software developer. Curious about everything." Below the intro is a "Recent Writing" section showing the 5 most recent blog posts with titles, dates, and a "View all posts" link. Clean, minimal, does the job. The tagline and interests list set the tone for the rest of the site.

### Stop 2: Blog Listing (`/blog`)

Full chronological list of all published posts. Each entry shows title, date, tags, and description. There are 31 posts total -- 30 migrated from the old WordPress/Jekyll blog (dating back to 2013) and 1 brand new post about Claude Code investigating its own $197 session. The range spans GSoC with Mozilla, Vim deep dives, DevOps war stories, and the new AI/developer-tools writing.

### Stop 3: Blog Post Detail (`/blog/claude-code-investigating-itself`)

Pick the newest post to show off. Full prose rendering with the Tailwind Typography plugin. Header shows title, date, and tags. The content flows well in the `max-w-prose` column. This is the one post written natively for the new site -- the migrated posts are worth eyeballing separately (more on that in Known Gaps).

### Stop 4: Annotations Listing (`/annotations`)

This is the new feature. The page says "Annotated Readings" with a subtitle explaining the concept. Currently shows one sample article: Paul Graham's "Do Things That Don't Scale." Each entry displays title, author, annotation date, description, and tags. The empty-state is handled gracefully if all content were removed.

### Stop 5: Annotation Detail (`/annotations/do-things-that-dont-scale`)

The flagship feature. Header shows "Annotated Reading" label, article title, author, link to original source, and snapshot date. The article body renders with highlighted anchor text in amber. There are 5 annotations: 3 margin notes (short commentary positioned in the right margin on wide screens) and 2 inline notes (longer commentary blocks). Clicking/tapping a highlight reveals the note. On desktop (xl+), margin notes float to the right. On mobile, they collapse to popovers. This is a React island (`client:load`) so it hydrates on the client.

### Stop 6: Projects (`/projects`)

Card grid showing projects with title, description, tags, and links to source/demo. Currently just one project listed: "clauson" (the Claude Code session log analyzer). The grid layout is ready for more entries.

### Stop 7: About (`/about`)

Short bio paragraph. Has a link to `/resume.pdf` -- but there is no resume file uploaded yet (the `public/` directory does not exist). This is a known gap.

### Stop 8: Links (`/links`)

Linktree-style page with GitHub, LinkedIn, and X/Twitter. Clean card layout with handles. Each opens in a new tab.

### Stop 9: Contact (`/contact`)

Simple page with email address and links to GitHub/LinkedIn. Straightforward.

### Stop 10: Dark Mode Toggle

Available in the header on both desktop and mobile. Uses sun/moon icons. Persists preference to `localStorage` and respects `prefers-color-scheme` on first visit. Transitions are smooth with `transition-colors` on the body.

### Stop 11: Mobile Navigation

On screens below `md` breakpoint, the desktop nav links collapse behind a hamburger menu. Tapping it reveals a dropdown with all 7 nav items. The hamburger toggles to an X icon when open. Theme toggle is always visible on mobile.

---

## 2. What's Working

- **Full Astro v5 static site** builds successfully with `astro build`
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin and `@tailwindcss/typography` for prose styling
- **31 blog posts** rendering correctly (30 migrated + 1 new)
- **Blog listing and detail pages** with date sorting, tag display, and draft filtering
- **Homepage** with 5 most recent posts and clean intro section
- **Annotation feature** end-to-end: content collection, YAML sidecar annotations, React island rendering, anchor matching with highlight/margin/inline note types
- **1 sample annotated article** (Paul Graham essay) with 5 annotations demonstrating both note types
- **CLI authoring script** (`npm run annotate <url>`) for fetching and scaffolding new annotated articles using Mozilla Readability + Turndown
- **Anchor matching algorithm** with `startContext` disambiguation and overlap resolution, fully unit tested
- **Dark mode** with system preference detection, manual toggle, and localStorage persistence
- **Mobile responsive navigation** with hamburger menu, icon toggle, and `astro:after-swap` re-initialization
- **7 navigation links** in both desktop and mobile menus (Home, Blog, Annotations, Projects, About, Links, Contact)
- **Projects page** pulling from content collection with card grid layout
- **Links page** (linktree-style) with GitHub, LinkedIn, X/Twitter
- **Contact page** with email and social links
- **Full CI pipeline** (`.github/workflows/ci.yml`): lint, type check (astro check), unit tests, build, E2E tests -- all on Node 22
- **Unit tests** (`vitest`): annotations anchor matching + utility functions
- **E2E tests** (`playwright`): smoke tests, page rendering, blog navigation, annotation pages
- **Cloudflare Pages deployment config** (`wrangler.toml` pointing to `./dist`)
- **Code quality tooling**: ESLint, Prettier, Husky pre-commit hooks, lint-staged
- **Content collections** with Zod schemas for blog, projects, and annotations
- **Sticky header** with backdrop blur effect
- **Footer** with dynamic copyright year

---

## 3. Known Gaps / Polish Items

### Blockers (fix before launch)

- **No `public/` directory.** The `BaseLayout.astro` references `/favicon.svg` but no `public/` directory or favicon file exists. Browsers will 404 on the favicon. Need to create `public/favicon.svg` (or `.ico`).
- **About page links to `/resume.pdf` that does not exist.** Either upload a resume PDF to `public/resume.pdf` or remove/update the link. Currently a dead link.
- **No Open Graph / social meta tags.** Sharing any page on Twitter, Slack, or iMessage will produce a generic preview with no image, no description card. Need `og:title`, `og:description`, `og:image`, and `twitter:card` meta tags in `BaseLayout.astro`.

### Content Cleanup

- **17 of 30 migrated blog posts contain raw HTML** (WordPress-era `<p>`, `<address>`, `<img>`, `<ul>` tags mixed into markdown). These render but look inconsistent -- some have bare `<address>` tags, WordPress image markup, and legacy CSS classes. Posts affected include the GSoC series, Vim posts, funsize posts, and others. A cleanup pass to convert them to clean markdown would improve consistency.
- **Some old posts may reference broken image paths.** The WordPress-era posts reference `{{site.url}}/media/` image paths that no longer resolve. Need to either host those images in `public/` or remove the references.
- **About page is placeholder text.** Just two short paragraphs -- one is clearly a placeholder ("Placeholder for more detailed about content").
- **Only 1 project listed.** The projects grid layout is ready for more, but "clauson" is the only entry. Decide whether to launch with one or add more.

### Feature Polish

- **Annotation margin notes positioning.** The margin notes use `useEffect` + `getBoundingClientRect` for absolute positioning. This works on initial render but may drift on window resize or dynamic content changes. No resize listener is currently wired up.
- **Annotation rendering is plain-text only.** The `AnnotatedArticle` component splits source by `\n\n` into paragraphs and renders as plain text spans. Source markdown formatting (headers, bold, links, lists) within the article is lost. The Paul Graham sample is all prose so this is not immediately visible, but articles with richer formatting would render flat.
- **Inline annotation notes don't render markdown.** The `note` field in annotations supports markdown according to the design doc, but the React component renders notes as plain text strings, not parsed markdown.
- **No RSS feed.** Common expectation for a personal blog.
- **No 404 page.** Astro serves a default 404, but a custom one matching the site design would be better.
- **No sitemap.** Astro has a `@astrojs/sitemap` integration that would be easy to add.
- **Blog posts have no "back to blog" navigation.** After reading a post, the only way back is the header nav.
- **No reading time estimate** on blog posts.
- **Annotation listing page constructs URLs with `.replace(/\/source$/, "")`.** This is a workaround for how Astro's glob loader names the collection entries. It works but is brittle -- if the content collection loader behavior changes, the links break.
- **Dark mode classes not applied on Projects page.** The project cards use `text-stone-600` and `bg-stone-100` without `dark:` variants, so they may look washed out in dark mode.
- **No search functionality.** Not critical for v1 with 31 posts, but worth considering.
- **Screenshots in repo root.** There are `homepage-dark.png`, `homepage-light.png`, and `annotation-demo.png` sitting in the repo root. These should either be moved somewhere intentional or removed -- they will bloat the repo over time.

---

## 4. Stakeholder Questions

These are the decisions that only you (Anhad) can make. Take your time -- none of these are urgent blockers, but answering them will shape what gets done next.

**Q1: Content voice and audience.** The sample annotation notes are written in a startup/founder voice ("Every successful startup I know..."). Is that the voice you want for annotations generally, or will the tone vary by article? Knowing this helps decide whether the sample content is representative or needs revision before launch.

**Q2: Launch scope -- what pages are you comfortable going live with today?** The blog and annotations are solid. The about page is placeholder, projects has one entry, and there is no resume PDF. Would you rather launch with everything visible and iterate, or hide the thinner pages (About, Projects) until they have more substance?

**Q3: The 17 migrated posts with raw HTML -- how important is cleaning those up before launch?** They render (Astro/browsers handle the HTML fine), but they look rougher than the markdown-native posts. Is this a "fix before anyone sees it" thing, or a "nobody reads posts from 2013 anyway" thing?

**Q4: Are there specific old blog images you want to preserve?** Several migrated posts reference WordPress-hosted images (`{{site.url}}/media/...`). If those images matter, we need to track down the originals (possibly in the `.old-blog/` directory) and host them. If not, we should at least remove the broken `<img>` tags so they don't 404.

**Q5: What does your annotation workflow look like in practice?** The CLI script fetches and scaffolds articles, then you hand-edit YAML. Have you tried this workflow yet? Is it comfortable, or would you rather invest in a better authoring experience before publishing more annotations?

**Q6: How do you feel about the annotation visual design?** Amber highlights, margin notes on wide screens, popovers on mobile. Is this the right aesthetic, or do you have a different vision? Any reference sites you like for how annotations should look and feel?

**Q7: Favicon and branding -- do you have a logo or icon in mind?** The site currently has no favicon at all. Even a simple text-based SVG favicon ("f" or a bird/fledgling motif) would be better than nothing. Do you have something, or should we generate one?

**Q8: RSS feed -- do you want one?** Many personal blog readers expect RSS. Astro makes it easy to add. If yes, should it cover just blog posts, or annotations too?

**Q9: Domain and deployment -- is `ffledgling.dev` registered and DNS pointed at Cloudflare Pages?** The `wrangler.toml` and `astro.config.mjs` are configured for it, but is the actual domain setup done? Any Cloudflare Pages project created yet?

**Q10: Social sharing and analytics -- do you care?** Open Graph tags are missing (easy fix). Do you also want analytics (Cloudflare Web Analytics is free and privacy-respecting)? Or do you prefer no tracking at all?

**Q11: Are there other articles you want to annotate before launch?** Having 2-3 annotated articles would make the feature feel more intentional than a single demo. Do you have articles in mind, or is one enough for v1?

**Q12: What is your ongoing publishing cadence?** This affects prioritization. If you plan to write weekly, investing in quality-of-life features (draft preview, RSS, reading time) pays off quickly. If it is more occasional, polish and design matter more than workflow tooling.

---

## 5. Next Steps

Prioritized by impact and effort. Adjust based on your answers above.

### Before launch (do now)

1. **Create `public/` directory with favicon.** Even a minimal SVG. Takes 5 minutes, avoids the broken favicon request on every page load.
2. **Fix the About page.** Either write real content or remove the dead resume link and placeholder text. This is the page people visit right after the homepage.
3. **Add Open Graph meta tags.** Add `og:title`, `og:description`, `og:image`, and `twitter:card` to `BaseLayout.astro`. Without this, every share of the site looks broken.
4. **Add dark mode variants to Projects page.** Quick Tailwind class additions so the cards do not look wrong in dark mode.

### Soon after launch (this week)

5. **Clean up the highest-traffic migrated posts.** Pick the 5-10 posts most likely to get traffic (the Vim posts, the Claude Code post, the GSoC posts) and convert their raw HTML to clean markdown. Defer the rest.
6. **Recover or remove broken blog images.** Check `.old-blog/` for original images. Host what matters in `public/media/`, remove what does not.
7. **Add RSS feed.** Install `@astrojs/rss`, create `src/pages/rss.xml.ts`. Quick win for discoverability.
8. **Add a custom 404 page.** `src/pages/404.astro` with a friendly message and link back home.
9. **Add sitemap.** `@astrojs/sitemap` integration, one line in config.
10. **Move screenshots out of repo root.** Put them in `docs/` or delete them if they are not needed.

### When you have time (next couple weeks)

11. **Add 1-2 more annotated articles.** Test the CLI workflow end-to-end and build out the annotations section so it does not feel like a single demo.
12. **Improve annotation rendering** to handle markdown in source articles (headers, links, bold) and in note text.
13. **Add resize listener to margin note positioning** so notes stay aligned when the window is resized.
14. **Add reading time estimates** to blog posts.
15. **Add "Back to blog" link** on individual post pages.
16. **Write a proper About page** with your background, interests, and what the site is about.

### Future backlog

17. Annotation count badges on the listing page
18. Search functionality (could use Pagefind for static site search)
19. Blog post series/grouping for the GSoC and funsize multi-part posts
20. Sharable deep links to specific annotations
21. Browser-based annotation authoring UI
22. Analytics (Cloudflare Web Analytics or similar)
