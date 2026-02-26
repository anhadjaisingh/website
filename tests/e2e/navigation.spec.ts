import { test, expect } from "@playwright/test";

test("header navigation links are present on desktop", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("header nav");
  await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Annotations" })).toBeVisible();
});

test("mobile menu toggle works", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  const menuButton = page.getByLabel("Toggle menu");
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  const header = page.locator("header");
  await expect(
    header.getByRole("link", { name: "Blog", exact: true }),
  ).toBeVisible();
});
