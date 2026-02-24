# Personal Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy a personal website for Anhad Jai Singh at ffledgling.dev using Astro, Tailwind CSS, and Cloudflare Pages.

**Architecture:** Astro v5 static site with Content Collections for blog posts and projects. Tailwind CSS v4 for styling via Vite plugin. React available for interactive islands (phase 2). Cloudflare Pages for hosting with auto-deploy on push.

**Tech Stack:** Astro v5, Tailwind CSS v4, TypeScript (strict), Vitest, Playwright, ESLint, Prettier, Husky, GitHub Actions, Cloudflare Pages.

**Design Doc:** `docs/plans/2026-02-24-personal-website-design.md`

---

## Task 1: Project Scaffolding

**Files:**

- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/styles/global.css`
- Delete: `blog/claude-code-investigating-itself.md` (will be moved to content collection later)

**Step 1: Initialize Astro project in the existing repo**

Run the create command with the minimal template, then move files into place. Since we have an existing repo with files, we'll create in a temp directory and move.

```bash
cd /Users/anhad/Personal/website
npx create-astro@latest tmp-astro --template minimal --no-install --no-git --typescript strict
```

Then move all generated files from `tmp-astro/` into the repo root (overwriting nothing important — only LICENSE and blog/ exist):

```bash
mv tmp-astro/* tmp-astro/.* . 2>/dev/null; rmdir tmp-astro
```

**Step 2: Install Tailwind CSS v4**

```bash
npm install tailwindcss @tailwindcss/vite
```

**Step 3: Configure Astro with Tailwind**

Update `astro.config.mjs`:

```javascript
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ffledgling.dev",
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Step 4: Create global CSS**

Create `src/styles/global.css`:

```css
@import "tailwindcss";
```

**Step 5: Update index.astro to import global CSS and verify**

```astro
---
import "../styles/global.css";
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>ffledgling.dev</title>
  </head>
  <body class="bg-stone-50 text-stone-900">
    <h1 class="text-3xl font-bold p-8">ffledgling.dev — coming soon</h1>
  </body>
</html>
```

**Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on localhost:4321, page renders with styled heading.

**Step 7: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes, output in `dist/`.

**Step 8: Create `.gitignore`**

Ensure `.gitignore` includes:

```
node_modules/
dist/
.astro/
.playwright-mcp/
```

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro project with Tailwind CSS v4"
```

---

## Task 2: Code Quality Tooling (ESLint, Prettier, Husky)

**Files:**

- Create: `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.husky/pre-commit`
- Modify: `package.json` (scripts, lint-staged config)

**Step 1: Install ESLint with Astro plugin**

```bash
npm install -D eslint eslint-plugin-astro @typescript-eslint/parser
```

**Step 2: Create ESLint config**

Create `eslint.config.mjs`:

```javascript
import eslintPluginAstro from "eslint-plugin-astro";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // Add project-specific rules as needed
    },
  },
];
```

**Step 3: Install Prettier with Astro plugin**

```bash
npm install -D prettier prettier-plugin-astro
```

**Step 4: Create Prettier config**

Create `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": {
        "parser": "astro"
      }
    }
  ]
}
```

Create `.prettierignore`:

```
dist/
node_modules/
.astro/
```

**Step 5: Install Husky and lint-staged**

```bash
npm install -D husky lint-staged
npx husky init
```

**Step 6: Configure lint-staged**

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{js,ts,mjs,astro}": ["eslint --fix", "prettier --write"],
    "*.{json,md,mdx,css}": ["prettier --write"]
  }
}
```

**Step 7: Update Husky pre-commit hook**

Update `.husky/pre-commit`:

```bash
npx lint-staged
```

**Step 8: Add scripts to package.json**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "eslint . && prettier --check .",
    "lint:fix": "eslint --fix . && prettier --write .",
    "format": "prettier --write ."
  }
}
```

**Step 9: Run lint to verify setup**

```bash
npm run lint
```

Expected: Passes (or fix any initial issues).

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: add ESLint, Prettier, and Husky pre-commit hooks"
```

---

## Task 3: Testing Infrastructure (Vitest + Playwright)

**Files:**

- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/unit/example.test.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (scripts)

**Step 1: Install Vitest**

```bash
npm install -D vitest
```

**Step 2: Create Vitest config**

Create `vitest.config.ts`:

```typescript
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["tests/unit/**/*.test.{ts,js}"],
  },
});
```

**Step 3: Write a smoke unit test**

Create `tests/unit/example.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("smoke test", () => {
  it("should pass basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 4: Run unit test to verify**

```bash
npx vitest run
```

Expected: 1 test passes.

**Step 5: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Step 6: Create Playwright config**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:4321",
  },
});
```

**Step 7: Write a smoke E2E test**

Create `tests/e2e/smoke.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ffledgling/i);
});
```

**Step 8: Build and run E2E test**

```bash
npm run build
npx playwright test
```

Expected: 1 test passes.

**Step 9: Add test scripts to package.json**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:all": "vitest run && playwright test"
  }
}
```

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Vitest and Playwright testing infrastructure"
```

---

## Task 4: GitHub Actions CI Pipeline

**Files:**

- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx astro check

      - name: Unit tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: E2E tests
        run: npm run test:e2e
```

**Step 2: Install astro check dependency**

```bash
npm install -D @astrojs/check
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add GitHub Actions CI pipeline"
```

---

## Task 5: Base Layout and Navigation

**Files:**

- Create: `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`
- Modify: `src/pages/index.astro`, `src/styles/global.css`

**Step 1: Set up fonts in global CSS**

Update `src/styles/global.css` to import fonts and set up CSS custom properties:

```css
@import "tailwindcss";

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap");

@theme {
  --font-sans: "Inter", sans-serif;
  --font-serif: "Playfair Display", serif;
  --font-mono: "JetBrains Mono", monospace;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
}
```

**Step 2: Create Header component**

Create `src/components/Header.astro`:

```astro
---
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/links", label: "Links" },
  { href: "/contact", label: "Contact" },
];

const currentPath = Astro.url.pathname;
---

<header
  class="sticky top-0 z-50 bg-stone-50/80 backdrop-blur-sm border-b border-stone-200"
>
  <nav class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
    <a
      href="/"
      class="font-serif text-xl font-bold text-stone-900 hover:text-accent transition-colors"
    >
      ffledgling
    </a>
    <ul class="flex gap-6 text-sm">
      {
        navLinks.map((link) => (
          <li>
            <a
              href={link.href}
              class:list={[
                "transition-colors hover:text-accent",
                currentPath === link.href
                  ? "text-accent font-medium"
                  : "text-stone-600",
              ]}
            >
              {link.label}
            </a>
          </li>
        ))
      }
    </ul>
  </nav>
</header>
```

**Step 3: Create Footer component**

Create `src/components/Footer.astro`:

```astro
---
const year = new Date().getFullYear();
---

<footer class="border-t border-stone-200 mt-16">
  <div class="max-w-4xl mx-auto px-4 py-8 text-sm text-stone-500">
    <p>&copy; {year} Anhad Jai Singh</p>
  </div>
</footer>
```

**Step 4: Create BaseLayout**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import "../styles/global.css";

interface Props {
  title: string;
  description?: string;
}

const { title, description = "Personal website of Anhad Jai Singh" } =
  Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title} | ffledgling.dev</title>
  </head>
  <body class="bg-stone-50 text-stone-900 font-sans antialiased">
    <Header />
    <main class="max-w-4xl mx-auto px-4 py-8">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

**Step 5: Update index.astro to use BaseLayout**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Home">
  <h1 class="font-serif text-4xl font-bold mb-2">Anhad Jai Singh</h1>
  <p class="text-lg text-stone-500 mb-8">
    Software developer. Curious about everything.
  </p>
  <p class="text-stone-700 max-w-prose leading-relaxed">
    Welcome to my corner of the internet. I write about software, and
    occasionally about the many other things that catch my attention — finance,
    golf, mechanical keyboards, watches, art, and whatever else I'm exploring.
  </p>
</BaseLayout>
```

**Step 6: Verify dev server renders correctly**

```bash
npm run dev
```

Expected: Page loads with header nav, styled content, footer.

**Step 7: Write E2E test for navigation**

Create `tests/e2e/navigation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("header navigation links are present", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("header nav");
  await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
});

test("homepage displays site title", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Anhad Jai Singh");
});
```

**Step 8: Build and run tests**

```bash
npm run build && npx playwright test
```

Expected: All E2E tests pass.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add base layout with header navigation and footer"
```

---

## Task 6: Content Collections Schema

**Files:**

- Create: `src/content.config.ts`, `src/content/blog/.gitkeep`, `src/content/projects/.gitkeep`

**Step 1: Create content collection config**

Create `src/content.config.ts`:

```typescript
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    sortOrder: z.number().default(0),
  }),
});

export const collections = { blog, projects };
```

**Step 2: Create content directories**

```bash
mkdir -p src/content/blog src/content/projects
touch src/content/blog/.gitkeep src/content/projects/.gitkeep
```

**Step 3: Add a test blog post**

Create `src/content/blog/hello-world.md`:

```markdown
---
title: "Hello World"
description: "First post on the new site."
date: 2026-02-24
tags: ["meta"]
---

This is a test post to verify the content collection is working.
```

**Step 4: Add a test project**

Create `src/content/projects/clauson.md`:

```markdown
---
title: "clauson"
description: "A CLI for analyzing Claude Code's JSONL session logs."
tags: ["rust", "cli", "ai"]
repoUrl: "https://github.com/anhadg/clauson"
sortOrder: 1
---

A Rust CLI that parses Claude Code session logs and provides analytics on token usage, tool calls, timing, and conversation structure. Think of it as `htop` for Claude Code sessions.
```

**Step 5: Verify build with content collections**

```bash
npm run build
```

Expected: Build succeeds, content collections are processed.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add content collection schemas for blog and projects"
```

---

## Task 7: Blog Listing and Post Pages

**Files:**

- Create: `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`, `src/layouts/BlogPostLayout.astro`, `src/lib/utils.ts`

**Step 1: Create utility functions**

Create `src/lib/utils.ts`:

```typescript
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200);
}
```

**Step 2: Write unit test for utilities**

Create `tests/unit/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatDate, estimateReadingTime } from "../../src/lib/utils";

describe("formatDate", () => {
  it("formats a date in US English", () => {
    const date = new Date("2026-02-24");
    const result = formatDate(date);
    expect(result).toContain("2026");
    expect(result).toContain("February");
    expect(result).toContain("24");
  });
});

describe("estimateReadingTime", () => {
  it("estimates reading time based on 200 wpm", () => {
    const words = Array(400).fill("word").join(" ");
    expect(estimateReadingTime(words)).toBe(2);
  });

  it("rounds up partial minutes", () => {
    const words = Array(250).fill("word").join(" ");
    expect(estimateReadingTime(words)).toBe(2);
  });
});
```

**Step 3: Run unit tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 4: Create BlogPostLayout**

Create `src/layouts/BlogPostLayout.astro`:

```astro
---
import BaseLayout from "./BaseLayout.astro";
import { formatDate } from "../lib/utils";

interface Props {
  title: string;
  description: string;
  date: Date;
  tags: string[];
}

const { title, description, date, tags } = Astro.props;
---

<BaseLayout title={title} description={description}>
  <article class="max-w-prose mx-auto">
    <header class="mb-8">
      <h1 class="font-serif text-4xl font-bold mb-3">{title}</h1>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
        <time datetime={date.toISOString()}>{formatDate(date)}</time>
        {
          tags.length > 0 && (
            <div class="flex gap-2">
              {tags.map((tag) => (
                <span class="text-accent">#{tag}</span>
              ))}
            </div>
          )
        }
      </div>
    </header>
    <div class="prose prose-stone prose-lg max-w-none">
      <slot />
    </div>
  </article>
</BaseLayout>
```

**Step 5: Create blog listing page**

Create `src/pages/blog/index.astro`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";
import { formatDate } from "../../lib/utils";

const posts = (await getCollection("blog"))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---

<BaseLayout title="Blog">
  <h1 class="font-serif text-4xl font-bold mb-8">Blog</h1>
  <ul class="space-y-8">
    {
      posts.map((post) => (
        <li>
          <a href={`/blog/${post.id}`} class="group block">
            <h2 class="text-xl font-semibold group-hover:text-accent transition-colors">
              {post.data.title}
            </h2>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500 mt-1">
              <time datetime={post.data.date.toISOString()}>
                {formatDate(post.data.date)}
              </time>
              {post.data.tags.length > 0 && (
                <div class="flex gap-2">
                  {post.data.tags.map((tag: string) => (
                    <span>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <p class="text-stone-600 mt-2">{post.data.description}</p>
          </a>
        </li>
      ))
    }
  </ul>
</BaseLayout>
```

**Step 6: Create individual blog post page**

Create `src/pages/blog/[...slug].astro`:

```astro
---
import { getCollection, render } from "astro:content";
import BlogPostLayout from "../../layouts/BlogPostLayout.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BlogPostLayout
  title={post.data.title}
  description={post.data.description}
  date={post.data.date}
  tags={post.data.tags}
>
  <Content />
</BlogPostLayout>
```

**Step 7: Install Tailwind typography plugin**

```bash
npm install @tailwindcss/typography
```

Add to `src/styles/global.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

**Step 8: Verify blog pages render**

```bash
npm run dev
```

Navigate to `localhost:4321/blog` and `localhost:4321/blog/hello-world`.

Expected: Blog listing shows test post, individual post renders with styled prose.

**Step 9: Write E2E tests for blog**

Create `tests/e2e/blog.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("blog listing page loads", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.locator("h1")).toContainText("Blog");
});

test("blog listing shows posts", async ({ page }) => {
  await page.goto("/blog");
  const posts = page.locator("ul li");
  await expect(posts).not.toHaveCount(0);
});

test("blog post page loads", async ({ page }) => {
  await page.goto("/blog/hello-world");
  await expect(page.locator("h1")).toContainText("Hello World");
});
```

**Step 10: Build and run all tests**

```bash
npm run build && npx vitest run && npx playwright test
```

Expected: All tests pass.

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: add blog listing and post pages with content collections"
```

---

## Task 8: Remaining Pages (About, Projects, Links, Contact)

**Files:**

- Create: `src/pages/about.astro`, `src/pages/projects.astro`, `src/pages/links.astro`, `src/pages/contact.astro`

**Step 1: Create About page**

Create `src/pages/about.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="About">
  <div class="max-w-prose mx-auto">
    <h1 class="font-serif text-4xl font-bold mb-8">About</h1>
    <div class="prose prose-stone prose-lg">
      <p>
        I'm Anhad Jai Singh — a software developer by profession with a wide
        range of interests spanning finance, economics, golf, mechanical
        keyboards, watches, art, fashion, and more.
      </p>
      <p>
        Placeholder for more detailed about content. Link to
        <a href="/resume.pdf">downloadable resume (PDF)</a>.
      </p>
    </div>
  </div>
</BaseLayout>
```

**Step 2: Create Projects page**

Create `src/pages/projects.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

const projects = (await getCollection("projects")).sort(
  (a, b) => a.data.sortOrder - b.data.sortOrder,
);
---

<BaseLayout title="Projects">
  <h1 class="font-serif text-4xl font-bold mb-8">Projects</h1>
  <div class="grid gap-6 sm:grid-cols-2">
    {
      projects.map((project) => (
        <div class="border border-stone-200 rounded-lg p-6 hover:border-stone-300 transition-colors">
          <h2 class="text-lg font-semibold mb-1">{project.data.title}</h2>
          <p class="text-stone-600 text-sm mb-3">{project.data.description}</p>
          <div class="flex flex-wrap gap-2 mb-3">
            {project.data.tags.map((tag: string) => (
              <span class="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div class="flex gap-3 text-sm">
            {project.data.repoUrl && (
              <a
                href={project.data.repoUrl}
                class="text-accent hover:underline"
              >
                Source
              </a>
            )}
            {project.data.demoUrl && (
              <a
                href={project.data.demoUrl}
                class="text-accent hover:underline"
              >
                Demo
              </a>
            )}
          </div>
        </div>
      ))
    }
  </div>
</BaseLayout>
```

**Step 3: Create Links page**

Create `src/pages/links.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";

const links = [
  {
    name: "GitHub",
    url: "https://github.com/ffledgling",
    handle: "@ffledgling",
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/anhadjaisingh",
    handle: "Anhad Jai Singh",
  },
  {
    name: "X / Twitter",
    url: "https://x.com/ffledgling",
    handle: "@ffledgling",
  },
];
---

<BaseLayout title="Links">
  <div class="max-w-prose mx-auto">
    <h1 class="font-serif text-4xl font-bold mb-8">Links</h1>
    <ul class="space-y-4">
      {
        links.map((link) => (
          <li>
            <a
              href={link.url}
              class="flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:border-stone-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="font-medium">{link.name}</span>
              <span class="text-stone-500 text-sm">{link.handle}</span>
            </a>
          </li>
        ))
      }
    </ul>
  </div>
</BaseLayout>
```

**Step 4: Create Contact page**

Create `src/pages/contact.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Contact">
  <div class="max-w-prose mx-auto">
    <h1 class="font-serif text-4xl font-bold mb-8">Get in Touch</h1>
    <div class="prose prose-stone prose-lg">
      <p>
        The best way to reach me is via email at
        <a href="mailto:ffledgling@gmail.com">ffledgling@gmail.com</a>.
      </p>
      <p>
        You can also find me on <a href="https://github.com/ffledgling"
          >GitHub</a
        >
        and <a href="https://linkedin.com/in/anhadjaisingh">LinkedIn</a>.
      </p>
    </div>
  </div>
</BaseLayout>
```

**Step 5: Write E2E tests for all pages**

Create `tests/e2e/pages.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

const pages = [
  { path: "/", title: "Home" },
  { path: "/about", title: "About" },
  { path: "/projects", title: "Projects" },
  { path: "/links", title: "Links" },
  { path: "/contact", title: "Contact" },
];

for (const { path, title } of pages) {
  test(`${title} page loads at ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(new RegExp(title, "i"));
  });
}
```

**Step 6: Build and run all tests**

```bash
npm run build && npx vitest run && npx playwright test
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add About, Projects, Links, and Contact pages"
```

---

## Task 9: Home Page with Recent Posts

**Files:**

- Modify: `src/pages/index.astro`

**Step 1: Update home page to show recent posts**

Update `src/pages/index.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";
import { formatDate } from "../lib/utils";

const recentPosts = (await getCollection("blog"))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 5);
---

<BaseLayout title="Home">
  <section class="mb-16">
    <h1 class="font-serif text-4xl font-bold mb-2">Anhad Jai Singh</h1>
    <p class="text-lg text-stone-500 mb-8">
      Software developer. Curious about everything.
    </p>
    <p class="text-stone-700 max-w-prose leading-relaxed">
      Welcome to my corner of the internet. I write about software, and
      occasionally about the many other things that catch my attention —
      finance, golf, mechanical keyboards, watches, art, and whatever else I'm
      exploring.
    </p>
  </section>

  <section>
    <h2 class="font-serif text-2xl font-bold mb-6">Recent Writing</h2>
    <ul class="space-y-6">
      {
        recentPosts.map((post) => (
          <li>
            <a href={`/blog/${post.id}`} class="group block">
              <h3 class="text-lg font-semibold group-hover:text-accent transition-colors">
                {post.data.title}
              </h3>
              <div class="text-sm text-stone-500 mt-1">
                <time datetime={post.data.date.toISOString()}>
                  {formatDate(post.data.date)}
                </time>
              </div>
            </a>
          </li>
        ))
      }
    </ul>
    <a
      href="/blog"
      class="inline-block mt-6 text-accent hover:underline text-sm"
    >
      View all posts &rarr;
    </a>
  </section>
</BaseLayout>
```

**Step 2: Build and verify**

```bash
npm run build && npx playwright test
```

Expected: All tests pass, homepage shows recent posts.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add recent posts to homepage"
```

---

## Task 10: Dark Mode

**Files:**

- Create: `src/components/ThemeToggle.astro`
- Modify: `src/layouts/BaseLayout.astro`, `src/styles/global.css`

**Step 1: Add dark mode styles**

Update `src/styles/global.css` to add dark variant colors:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap");

@theme {
  --font-sans: "Inter", sans-serif;
  --font-serif: "Playfair Display", serif;
  --font-mono: "JetBrains Mono", monospace;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
}

@custom-variant dark (&:where(.dark, .dark *));
```

**Step 2: Create ThemeToggle component**

Create `src/components/ThemeToggle.astro`:

```astro
<button
  id="theme-toggle"
  aria-label="Toggle dark mode"
  class="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
>
  <span id="theme-icon-light" class="hidden dark:inline">&#9788;</span>
  <span id="theme-icon-dark" class="inline dark:hidden">&#9790;</span>
</button>

<script>
  function initTheme() {
    const toggle = document.getElementById("theme-toggle");
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
    }

    toggle?.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }
  initTheme();
  document.addEventListener("astro:after-swap", initTheme);
</script>
```

**Step 3: Add ThemeToggle to Header**

Update `src/components/Header.astro` to include the toggle in the nav bar (after the nav links).

**Step 4: Add dark mode classes to BaseLayout body**

Update the `<body>` class in `src/layouts/BaseLayout.astro`:

```html
<body
  class="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans antialiased transition-colors"
></body>
```

**Step 5: Update all components with dark mode variants**

Go through Header, Footer, blog listing, blog post layout, and all pages — add `dark:` variants for backgrounds, text colors, and borders. For example:

- `border-stone-200` → `border-stone-200 dark:border-stone-700`
- `text-stone-500` → `text-stone-500 dark:text-stone-400`
- `bg-stone-100` → `bg-stone-100 dark:bg-stone-800`

**Step 6: Build and test**

```bash
npm run build && npx playwright test
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add dark mode with theme toggle"
```

---

## Task 11: Mobile Responsive Navigation

**Files:**

- Modify: `src/components/Header.astro`

**Step 1: Add mobile hamburger menu**

Update `src/components/Header.astro` to include a hamburger button visible on mobile (`md:hidden`) and hide the full nav on mobile (`hidden md:flex`). Add a mobile menu dropdown that toggles on click.

Use a small inline `<script>` for the toggle behavior (no framework needed).

**Step 2: Test responsive behavior**

Write a Playwright test that checks mobile viewport:

Add to `tests/e2e/navigation.spec.ts`:

```typescript
test("mobile menu toggle works", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  const menuButton = page.getByLabel("Toggle menu");
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.getByRole("link", { name: "Blog" })).toBeVisible();
});
```

**Step 3: Build and run tests**

```bash
npm run build && npx playwright test
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add responsive mobile navigation"
```

---

## Task 12: Documentation (CLAUDE.md, Publishing Workflow, Architecture)

**Files:**

- Create: `CLAUDE.md`, `docs/publishing-workflow.md`, `docs/architecture.md`

**Step 1: Create CLAUDE.md**

Create `CLAUDE.md` at project root:

```markdown
# CLAUDE.md — Project Guidelines

## Project Overview

Personal website for Anhad Jai Singh at ffledgling.dev. Built with Astro v5 + Tailwind CSS v4, deployed to Cloudflare Pages.

## Key Documentation

- **Design doc:** `docs/plans/2026-02-24-personal-website-design.md`
- **Implementation plan:** `docs/plans/2026-02-24-personal-website-implementation.md`
- **Publishing workflow:** `docs/publishing-workflow.md`
- **Architecture:** `docs/architecture.md`

## Commands

- `npm run dev` — Start dev server (localhost:4321)
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint + Prettier check
- `npm run lint:fix` — Auto-fix lint and format issues
- `npm run test` — Run unit tests (Vitest)
- `npm run test:e2e` — Run E2E tests (Playwright)
- `npm run test:all` — Run all tests

## Coding Standards

### Required for every change:

1. **TypeScript strict mode** — No `any` types. All new code must be fully typed.
2. **Lint must pass** — ESLint + Prettier. Pre-commit hooks enforce this automatically.
3. **Tests required** — Every new feature or bug fix needs tests:
   - Unit tests (Vitest) for utility functions and logic
   - E2E tests (Playwright) for pages, navigation, and user-facing behavior
4. **Build must succeed** — Run `npm run build` before committing. Broken builds are not acceptable.
5. **Commits are atomic** — One logical change per commit. Use conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

### Testing guidelines:

- Unit tests live in `tests/unit/` and mirror source structure
- E2E tests live in `tests/e2e/` and test user-visible behavior
- Test file naming: `*.test.ts` for unit, `*.spec.ts` for E2E
- Run `npm run test:all` to verify everything passes before pushing
- E2E tests require a build first (`npm run build`)

### Content:

- Blog posts go in `src/content/blog/` as `.md` or `.mdx` files
- Projects go in `src/content/projects/` as `.md` files
- See `docs/publishing-workflow.md` for frontmatter schemas and conventions

### Styling:

- Use Tailwind CSS utility classes
- Colors, fonts, and spacing are configured in `src/styles/global.css` via `@theme`
- Always include `dark:` variants for dark mode support
- Keep content max-width at ~720px for prose readability

### File organization:

- Pages: `src/pages/`
- Layouts: `src/layouts/`
- Components: `src/components/`
- Utilities: `src/lib/`
- Content: `src/content/`
- Tests: `tests/unit/` and `tests/e2e/`
```

**Step 2: Create publishing workflow doc**

Create `docs/publishing-workflow.md`:

````markdown
# Publishing Workflow

## Writing a Blog Post

1. Create a new file: `src/content/blog/your-post-slug.md`
2. Add frontmatter:

   ```yaml
   ---
   title: "Your Post Title"
   description: "A brief description for listings and SEO."
   date: 2026-02-24
   tags: ["tag1", "tag2"]
   draft: false
   ---
   ```
````

3. Write your content in Markdown below the frontmatter
4. For interactive content, use `.mdx` extension and import components:

   ```mdx
   ---
   title: "Interactive Post"
   description: "A post with embedded components."
   date: 2026-02-24
   tags: ["interactive"]
   ---

   import MyComponent from "../../components/MyComponent.tsx";

   Regular markdown here.

   <MyComponent />
   ```

5. Commit and push:
   ```bash
   git add src/content/blog/your-post-slug.md
   git commit -m "feat: add blog post - Your Post Title"
   git push
   ```
6. Cloudflare Pages auto-deploys on push to main.

## Frontmatter Schema

### Blog Posts (`src/content/blog/`)

| Field       | Type     | Required | Default | Description                        |
| ----------- | -------- | -------- | ------- | ---------------------------------- |
| title       | string   | Yes      | —       | Post title                         |
| description | string   | Yes      | —       | Brief description for listings/SEO |
| date        | date     | Yes      | —       | Publication date (YYYY-MM-DD)      |
| updatedDate | date     | No       | —       | Last updated date                  |
| tags        | string[] | No       | []      | Post tags                          |
| draft       | boolean  | No       | false   | Set true to hide from listings     |

### Projects (`src/content/projects/`)

| Field       | Type         | Required | Default | Description                   |
| ----------- | ------------ | -------- | ------- | ----------------------------- |
| title       | string       | Yes      | —       | Project name                  |
| description | string       | Yes      | —       | One-line description          |
| tags        | string[]     | No       | []      | Tech tags                     |
| repoUrl     | string (URL) | No       | —       | Source code link              |
| demoUrl     | string (URL) | No       | —       | Live demo link                |
| sortOrder   | number       | No       | 0       | Display order (lower = first) |

## Adding a Project

1. Create: `src/content/projects/project-name.md`
2. Add frontmatter (see schema above)
3. Write a short description in the body
4. Commit and push

## Local Development

```bash
npm run dev          # Start dev server at localhost:4321
npm run build        # Build for production
npm run preview      # Preview production build locally
```

## Deployment

Deployment is automatic via Cloudflare Pages on push to `main`. No manual steps required.

````

**Step 3: Create architecture doc**

Create `docs/architecture.md`:

```markdown
# Architecture

## Tech Stack

- **Astro v5** — Static site generator with Content Collections and islands architecture
- **Tailwind CSS v4** — Utility-first CSS via Vite plugin (not the deprecated @astrojs/tailwind)
- **TypeScript** — Strict mode throughout
- **React** — Available for interactive island components (phase 2)
- **Cloudflare Pages** — Static hosting with auto-deploy

## Project Structure

````

src/
├── content/ Content Collections (markdown files)
│ ├── blog/ Blog posts
│ └── projects/ Project descriptions
├── content.config.ts Collection schemas (Zod validation)
├── layouts/ Page layout templates
├── pages/ File-based routing
├── components/ Reusable UI components
├── lib/ Utility functions
└── styles/ Global CSS and theme configuration

```

## Key Decisions

### Content Collections (Astro v5)
- Config lives at `src/content.config.ts` (not inside src/content/)
- Uses `glob()` loader for local markdown files
- Schemas use Zod for type-safe frontmatter validation
- Query with `getCollection()` and `render()`

### Tailwind CSS v4
- Uses `@tailwindcss/vite` plugin directly (not the deprecated @astrojs/tailwind integration)
- Theme customization via `@theme` directive in `src/styles/global.css`
- Typography plugin for prose styling: `@tailwindcss/typography`
- Dark mode via `.dark` class on `<html>` with `@custom-variant`

### Static Output
- No SSR — pure static site generation
- All pages pre-rendered at build time
- Interactive components use Astro islands (client:load, client:visible)

### Testing Strategy
- **Unit (Vitest):** Utility functions, data transformations, content schema validation
- **E2E (Playwright):** Page rendering, navigation, responsive layout, dark mode

### Deployment
- Cloudflare Pages with `wrangler.toml` pointing to `./dist`
- GitHub Actions CI runs lint, type check, tests, and build on every PR
- Deploy triggered on push to main
```

**Step 4: Commit**

```bash
git add -A
git commit -m "docs: add CLAUDE.md, publishing workflow, and architecture docs"
```

---

## Task 13: Cloudflare Pages Deploy Configuration

**Files:**

- Create: `wrangler.toml`

**Step 1: Create wrangler.toml**

Create `wrangler.toml`:

```toml
name = "ffledgling-dev"
compatibility_date = "2026-02-24"

[assets]
directory = "./dist"
```

**Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "feat: add Cloudflare Pages deployment config"
```

---

## Task 14: Content Migration (Old Blog Posts)

**Files:**

- Create: Multiple files in `src/content/blog/`
- Modify: Move `blog/claude-code-investigating-itself.md` to `src/content/blog/` with proper frontmatter

**Step 1: Clone the old blog repo temporarily**

```bash
git clone https://github.com/ffledgling/blog /tmp/ffledgling-blog
```

**Step 2: Write a migration script**

Create a temporary script that:

1. Reads each post from `/tmp/ffledgling-blog/_posts/`
2. Extracts and normalizes frontmatter to match the new schema (title, description, date, tags)
3. Strips WordPress-era fields (wordpress_id, wordpress_url, author_login, author_email, date_gmt)
4. Converts HTML posts to markdown where needed
5. Writes to `src/content/blog/` with clean filenames (strip date prefix from Jekyll format)

**Step 3: Migrate the existing claude-code post**

Move `blog/claude-code-investigating-itself.md` to `src/content/blog/claude-code-investigating-itself.md` and add proper frontmatter:

```yaml
---
title: "I Asked Claude Code to Investigate Its Own $197 Session"
description: "What happens when you point an AI coding assistant at its own usage logs and say 'figure out why this cost so much'?"
date: 2026-02-22
tags: ["ai", "claude-code", "cost-analysis"]
---
```

**Step 4: Verify all posts build correctly**

```bash
npm run build
```

Expected: Build succeeds with all migrated posts.

**Step 5: Spot-check a few posts in dev server**

```bash
npm run dev
```

Navigate to blog listing and check that old posts render correctly.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: migrate 27 blog posts from old Jekyll site + existing post"
```

**Step 7: Clean up**

```bash
rm -rf /tmp/ffledgling-blog
rm -rf blog/  # Remove old blog directory from repo root
git add -A
git commit -m "chore: remove old blog directory from repo root"
```

---

## Task 15: Final Integration Test and Polish

**Files:**

- Modify: Various (fix any issues found)

**Step 1: Run full test suite**

```bash
npm run lint && npx astro check && npm run test && npm run build && npm run test:e2e
```

Expected: Everything passes.

**Step 2: Visual review with Playwright**

Take screenshots of all pages at desktop and mobile viewports to visually verify:

```bash
npx playwright test --update-snapshots  # if using visual regression
```

Or manually check in dev server.

**Step 3: Verify dark mode on all pages**

Navigate through all pages in both light and dark mode.

**Step 4: Fix any issues found**

Address layout bugs, missing dark mode variants, broken links, etc.

**Step 5: Final commit**

```bash
git add -A
git commit -m "fix: polish and integration fixes"
```

---

## Summary

| Task | Description            | Key Files                                                   |
| ---- | ---------------------- | ----------------------------------------------------------- |
| 1    | Project scaffolding    | `package.json`, `astro.config.mjs`, `src/pages/index.astro` |
| 2    | Code quality tooling   | `eslint.config.mjs`, `.prettierrc`, `.husky/pre-commit`     |
| 3    | Testing infrastructure | `vitest.config.ts`, `playwright.config.ts`, smoke tests     |
| 4    | CI pipeline            | `.github/workflows/ci.yml`                                  |
| 5    | Base layout + nav      | `BaseLayout.astro`, `Header.astro`, `Footer.astro`          |
| 6    | Content schemas        | `src/content.config.ts`, test content                       |
| 7    | Blog pages             | Blog listing, post pages, BlogPostLayout                    |
| 8    | Remaining pages        | About, Projects, Links, Contact                             |
| 9    | Home page              | Recent posts on homepage                                    |
| 10   | Dark mode              | ThemeToggle, dark variants                                  |
| 11   | Mobile nav             | Responsive hamburger menu                                   |
| 12   | Documentation          | CLAUDE.md, publishing-workflow.md, architecture.md          |
| 13   | Deploy config          | `wrangler.toml`                                             |
| 14   | Content migration      | 28 blog posts from old site + existing                      |
| 15   | Final polish           | Integration testing, visual review                          |
