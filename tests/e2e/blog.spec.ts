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
