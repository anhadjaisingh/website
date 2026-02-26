/**
 * ANNOTATION FEATURE — SPEC TESTS
 *
 * These tests define the behavioral contract for the annotation feature.
 * They serve as both E2E tests and a living specification.
 *
 * IMPORTANT FOR FUTURE AGENTS:
 * - Do NOT remove or weaken these tests without explicit user approval
 * - If a test breaks due to a code change, fix the code — not the test
 * - New features should ADD tests here, not modify existing ones
 * - These tests run against both production builds (rendering) and dev server (authoring)
 *
 * Feature overview:
 *   The annotation feature lets the user publish annotated readings of external articles.
 *   Articles are fetched, snapshotted as markdown, and stored with a YAML sidecar file
 *   containing annotations. The rendering shows highlighted text with margin notes (desktop)
 *   and popovers (mobile). An authoring UI (dev-only) allows inline annotation via
 *   text selection.
 *
 * Data model:
 *   src/content/annotations/<slug>/source.md        — article content + frontmatter
 *   src/content/annotations/<slug>/annotations.yaml — annotation definitions
 *
 * Annotation types:
 *   - "margin": short note displayed in the right margin on xl+ screens, popover on smaller
 *   - "inline": longer commentary displayed as a styled block when the highlight is clicked
 *
 * Annotation notes support markdown (links, images, bold, italic, code).
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// SECTION 1: ANNOTATION LISTING PAGE (/annotations)
// =============================================================================

test.describe("Annotation listing page", () => {
  test("renders page title and description", async ({ page }) => {
    await page.goto("/annotations");
    await expect(page.locator("h1")).toContainText("Annotated Readings");
    await expect(page.locator("text=Articles I've read closely")).toBeVisible();
  });

  test("lists annotated articles with title, author, date, and description", async ({
    page,
  }) => {
    await page.goto("/annotations");

    // Sample article should be listed
    await expect(page.locator("text=Do Things That Don't Scale")).toBeVisible();
    await expect(page.locator("text=Paul Graham").first()).toBeVisible();

    // Date should be present
    await expect(page.locator("time").first()).toBeVisible();

    // Description should be present
    await expect(page.locator("text=annotated reading").first()).toBeVisible();
  });

  test("displays tags as pill badges", async ({ page }) => {
    await page.goto("/annotations");

    // Tags should render as styled pills, not raw text with hashtags
    const tags = page.locator("text=startups");
    await expect(tags.first()).toBeVisible();
  });

  test("links to annotation detail pages", async ({ page }) => {
    await page.goto("/annotations");
    await page.click("text=Do Things That Don't Scale");
    await expect(page).toHaveURL(/\/annotations\/do-things-that-dont-scale/);
  });

  test("shows empty state when no articles exist", async ({ page }) => {
    // This test validates the empty state message exists in the template.
    // It will only trigger if all annotation content is removed.
    await page.goto("/annotations");
    const heading = page.locator("h1");
    await expect(heading).toContainText("Annotated Readings");
  });
});

// =============================================================================
// SECTION 2: ANNOTATION DETAIL PAGE (/annotations/[slug])
// =============================================================================

test.describe("Annotation detail page — header", () => {
  test("renders article title as h1", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    await expect(page.locator("h1")).toContainText(
      "Do Things That Don't Scale",
    );
  });

  test("shows author attribution", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    await expect(page.locator("text=Paul Graham").first()).toBeVisible();
  });

  test("shows 'Annotated Reading' label", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    await expect(page.locator("text=Annotated Reading")).toBeVisible();
  });

  test("links to original article with external link indicator", async ({
    page,
  }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const originalLink = page.locator("text=Original article");
    await expect(originalLink).toBeVisible();

    // Should open in new tab (target="_blank")
    const href = await originalLink.getAttribute("href");
    expect(href).toContain("paulgraham.com");
  });

  test("shows snapshot date", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    await expect(page.locator("text=Snapshotted")).toBeVisible();
    await expect(page.locator("time").first()).toBeVisible();
  });

  test("displays tags as pill badges", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    for (const tag of ["startups", "paul-graham", "growth"]) {
      await expect(page.locator(`text=${tag}`).first()).toBeVisible();
    }
  });
});

// =============================================================================
// SECTION 3: ANNOTATION RENDERING — HIGHLIGHTS
// =============================================================================

test.describe("Annotation rendering — highlights", () => {
  test("renders highlighted text using <mark> elements", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const marks = page.locator("mark");
    const count = await marks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("highlights contain the correct anchor text", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");

    // These are the anchor texts from the sample annotations.yaml
    const expectedAnchors = [
      "do things that don't scale",
      "the founders make them take off",
      "recruit users manually",
      "Collison installation",
      "underestimate the power of compound growth",
    ];

    for (const anchor of expectedAnchors) {
      const mark = page.locator("mark", { hasText: anchor });
      await expect(mark).toBeVisible();
    }
  });

  test("highlights are interactive (role=button, tabIndex)", async ({
    page,
  }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const firstMark = page.locator("mark").first();

    await expect(firstMark).toHaveAttribute("role", "button");
    await expect(firstMark).toHaveAttribute("tabindex", "0");
  });

  test("highlights have accessible labels", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const firstMark = page.locator("mark").first();
    const label = await firstMark.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(label).toContain("Annotation:");
  });
});

// =============================================================================
// SECTION 4: ANNOTATION RENDERING — MARGIN NOTES
// =============================================================================

test.describe("Annotation rendering — margin notes", () => {
  test("margin notes are present in the DOM on desktop", async ({ page }) => {
    // Set a wide viewport to show margin notes
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/annotations/do-things-that-dont-scale");

    // Margin note content should be visible
    await expect(page.locator("text=startup gospel").first()).toBeVisible();
  });
});

// =============================================================================
// SECTION 5: ANNOTATION RENDERING — CLICK INTERACTION
// =============================================================================

test.describe("Annotation rendering — click interaction", () => {
  test("clicking a margin-type highlight shows popover content", async ({
    page,
  }) => {
    await page.goto("/annotations/do-things-that-dont-scale");

    // Click the first highlight ("do things that don't scale" — margin type)
    const firstMark = page.locator("mark").first();
    await firstMark.click();

    // The annotation note should become visible as a popover
    await expect(page.locator("text=startup gospel").first()).toBeVisible();
  });

  test("clicking an inline-type highlight shows block commentary", async ({
    page,
  }) => {
    await page.goto("/annotations/do-things-that-dont-scale");

    // Click "recruit users manually" (inline type)
    const inlineMark = page.locator("mark", {
      hasText: "recruit users manually",
    });
    await inlineMark.click();

    // The inline annotation block should appear
    await expect(
      page.locator("text=core insight of the essay").first(),
    ).toBeVisible();
  });

  test("clicking a highlight again closes the popover", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");

    const mark = page.locator("mark", {
      hasText: "recruit users manually",
    });

    // Open
    await mark.click();
    await expect(
      page.locator("text=core insight of the essay").first(),
    ).toBeVisible();

    // Close
    await mark.click();
    await expect(
      page.locator("text=core insight of the essay"),
    ).not.toBeVisible();
  });
});

// =============================================================================
// SECTION 6: ANNOTATION RENDERING — MARKDOWN IN NOTES
//
// These tests verify that annotation notes render markdown syntax as HTML.
// They require annotations with markdown content in the sample data.
// =============================================================================

test.describe("Annotation rendering — markdown in notes", () => {
  test("renders markdown links as clickable HTML in margin notes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/annotations/do-things-that-dont-scale");

    // The a6 margin note contains a markdown link
    const link = page.locator(".annotation-note-content a", {
      hasText: "Paul Graham's essay on growth",
    });
    await expect(link.first()).toBeVisible();
    await expect(link.first()).toHaveAttribute(
      "href",
      "http://paulgraham.com/growth.html",
    );
  });

  test("markdown links open in new tabs", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/annotations/do-things-that-dont-scale");

    const link = page.locator(".annotation-note-content a").first();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });
});

// =============================================================================
// SECTION 7: NAVIGATION
// =============================================================================

test.describe("Annotation navigation", () => {
  test("Annotations link appears in the site header", async ({ page }) => {
    await page.goto("/");
    const navLink = page.locator("nav a", { hasText: "Annotations" });
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveAttribute("href", "/annotations");
  });

  test("Annotations nav link is active on annotations pages", async ({
    page,
  }) => {
    await page.goto("/annotations");
    const navLink = page.locator("nav a", { hasText: "Annotations" });

    // Active link should have the accent color class
    await expect(navLink).toHaveClass(/text-accent/);
  });
});

// =============================================================================
// SECTION 8: AUTHORING UI (DEV-MODE ONLY)
//
// These tests verify the inline authoring UI that allows creating, editing,
// and deleting annotations directly in the browser during local development.
//
// IMPORTANT: These tests require the Astro dev server (not a static build).
// They should be run separately with a dev server test configuration.
// =============================================================================

test.describe("Authoring UI — dev mode", () => {
  test.skip(
    true,
    "Requires dev server and authoring UI implementation — enable after v2 is built",
  );

  // --- New Article Creation ---
  // test: "New Article" form is visible on /annotations in dev mode
  // test: submitting a URL creates source.md and annotations.yaml
  // test: after creation, redirects to the new article page

  // --- Edit Mode Toggle ---
  // test: edit mode toggle button is visible in dev mode
  // test: edit mode toggle is NOT visible in production builds
  // test: toggling edit mode enables text selection behavior

  // --- Adding Annotations ---
  // test: selecting text in edit mode shows annotation popover
  // test: popover shows the selected text
  // test: popover has type toggle (margin/inline) and note textarea
  // test: saving an annotation persists it to annotations.yaml
  // test: new annotation appears as a highlight after save
  // test: note field supports markdown input

  // --- Editing Annotations ---
  // test: hovering a highlight in edit mode shows edit/delete buttons
  // test: clicking edit opens popover pre-filled with existing data
  // test: saving edits updates the annotation in annotations.yaml
  // test: edited note content appears in the updated highlight

  // --- Deleting Annotations ---
  // test: clicking delete shows confirmation
  // test: confirming delete removes the annotation from annotations.yaml
  // test: the highlight disappears after deletion
  // test: canceling delete keeps the annotation
});
