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
