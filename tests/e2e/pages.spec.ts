import { test, expect } from "@playwright/test";

const pages = [
  { path: "/", title: "Home" },
  { path: "/blog", title: "Blog" },
  { path: "/annotations", title: "Annotations" },
  { path: "/projects", title: "Projects" },
];

for (const { path, title } of pages) {
  test(`${title} page loads at ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(new RegExp(title, "i"));
  });
}
