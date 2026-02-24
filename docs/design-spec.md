# ffledgling.dev Design Spec

Canonical source of truth for design decisions. Update this when decisions change.

## Typography

- **Heading font:** Literata (serif) — used for h1-h6, site wordmark ("ffledgling")
- **Body/nav font:** Noto Sans (sans-serif) — used for body text, nav links, footer, UI elements
- **Code font:** JetBrains Mono (monospace)
- **Base font size:** 20px (set on `html` element)

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
- **Find Me:** Inline links (GitHub, LinkedIn, X/Twitter) separated by middots

## Footer

- Copyright + "Built with Astro, Cloudflare Pages & Claude Code. Source."

## Blog Posts

- **Prose styling:** prose-stone prose-lg with dark:prose-invert
- **Layout:** max-w-prose centered

## Process Rules

- All implementation via sub-agents/background tasks, keep main loop free
- One task at a time, tracked via TODO list
- Each task gets its own branch + PR, rebased against main before merge
- Spec file (this doc) is the source of truth for decisions
