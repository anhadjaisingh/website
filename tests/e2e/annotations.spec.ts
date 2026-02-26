import { test, expect } from "@playwright/test";

test.describe("Annotations listing page", () => {
  test("renders the annotations listing", async ({ page }) => {
    await page.goto("/annotations");
    await expect(page.locator("h1")).toContainText("Annotated Readings");
  });

  test("lists the sample annotated article", async ({ page }) => {
    await page.goto("/annotations");
    await expect(page.locator("text=Do Things That Don't Scale")).toBeVisible();
    await expect(page.locator("text=Paul Graham").first()).toBeVisible();
  });

  test("links to the annotation detail page", async ({ page }) => {
    await page.goto("/annotations");
    await page.click("text=Do Things That Don't Scale");
    await expect(page).toHaveURL(/\/annotations\/do-things-that-dont-scale/);
  });
});

test.describe("Annotation detail page", () => {
  test("renders the article header with attribution", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    await expect(page.locator("h1")).toContainText(
      "Do Things That Don't Scale",
    );
    await expect(page.getByText("by Paul Graham")).toBeVisible();
    await expect(page.locator("text=Original article")).toBeVisible();
  });

  test("renders highlighted annotation text", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const highlights = page.locator("mark");
    await expect(highlights.first()).toBeVisible();
  });

  test("shows annotation popover on highlight click", async ({ page }) => {
    await page.goto("/annotations/do-things-that-dont-scale");
    const firstHighlight = page.locator("mark").first();
    await firstHighlight.click();
    // Should show the annotation note text
    await expect(page.locator("text=startup gospel").first()).toBeVisible();
  });
});
