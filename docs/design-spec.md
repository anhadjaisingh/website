# ffledgling.dev Design Spec

Canonical source of truth for design decisions. Update this when decisions change.

## Typography

- **Heading/serif font:** DM Serif Display (serif) — used for h1-h6, site wordmark ("ffledgling"), inline emphasis (names)
- **Body/nav font:** Noto Sans (sans-serif) — used for body text, nav links, footer, UI elements
- **Code font:** JetBrains Mono (monospace)
- **Base font size:** 18px (set on `html` element)

## Colors

- **Accent:** #dc143c (crimson)
- **Accent hover:** #b91030
- **Dark mode background:** #0d1520 (ink blue)
- **Light mode background:** slate-50 (#f8fafc)
- **Text (light mode):** stone-900
- **Text (dark mode):** stone-100

## Layout

- **Max content width:** max-w-3xl (48rem)
- **Header:** sticky, backdrop-blur, border-b
- **Nav links:** Home, Blog, Annotations, Projects + theme toggle
- **Active nav indicator:** crimson color + font-semibold
- **Nav font weight:** font-medium (font-semibold when active)
- **Theme toggle:** ring-2 outline style (not filled background)

## Homepage — Split Hero + Content Layout

Two-section layout: hero at top, three-column content grid below.

### Hero Section

- **Layout:** Two-column split on desktop (flex-row), stacked on mobile (flex-col)
- **Left column:** Large name "Anhad" (font-serif text-5xl md:text-6xl), subtitle "a.k.a. ffledgling", bio paragraph with serif-bold names, two CTA buttons (Read Blog crimson filled, View Projects outline/ghost)
- **Right column:** Decorative element (three layered rotated rounded rectangles in accent color at low opacity with "ff" text centered), social links (GitHub, LinkedIn, Threads) vertical on desktop with icon + handle, horizontal on mobile with just icons
- **Separator:** border-b border-stone-200 dark:border-stone-700 with mb-16 pb-12

### Content Grid

- **Layout:** Three equal columns on desktop (grid-cols-1 md:grid-cols-3 gap-8)
- **Column 1 — Latest Posts:** 3 most recent non-draft blog posts, each with date (text-xs) and title (text-sm font-medium) linking to /blog/{post.id}
- **Column 2 — Projects:** First project by sortOrder with title, description (text-xs), and "Source →" link to repoUrl
- **Column 3 — Readings:** First annotated reading with title, "by {author}", and description (text-xs), linking to /annotations/{id without /source suffix}
- **Section headings:** font-serif text-xl with border-b underline

## Footer

- Three-column layout: "Website Source" (accent link) | "Built with" Astro/Cloudflare/Claude icons | Copyright
- Thin padding (py-3), text-sm

## Blog Posts

- **Prose styling:** prose-stone prose-lg with dark:prose-invert
- **Layout:** max-w-prose centered
- **Tags:** pill/chip style with borders, "tags:" prefix, no hashtags
- **Archive:** Posts older than 2 years collapsed under `<details>` element

## Process Rules

- All implementation via sub-agents/background tasks, keep main loop free
- One task at a time, tracked via TODO list
- Each task gets its own branch + PR, rebased against main before merge
- Spec file (this doc) is the source of truth for decisions
