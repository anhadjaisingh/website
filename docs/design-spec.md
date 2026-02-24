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

## Homepage

- **Bio:** Single paragraph intro, no email address on site
- **Name styling:** "Anhad" and "ffledgling" in font-serif font-extrabold
- **Social links:** Centered row with SVG icons (GitHub, LinkedIn, Threads), text-sm, positioned near footer with mt-auto pt-16

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
