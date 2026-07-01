import { expect, test } from "@playwright/test";

test.describe("bookshelf public", () => {
  test("anonymous user can view the bookshelf landing page", async ({ page }) => {
    await page.goto("/bookshelf");
    await expect(page.locator("h1")).toContainText("Bookshelf");
  });

  test("user can navigate from landing page to a category browse page", async ({ page }) => {
    await page.goto("/bookshelf");
    await expect(page.locator("h1")).toContainText("Bookshelf");

    // Locate the first category card link
    const firstCategoryLink = page.locator(".category-card-link").first();
    await expect(firstCategoryLink).toBeVisible();

    // Get the name of the category from the card text to verify it matches the heading on page load
    const cardText = await firstCategoryLink.innerText();
    const expectedTitle = cardText.split("\n")[0].trim();

    // Click it and verify navigation
    await Promise.all([page.waitForURL(/\/bookshelf\/[^/]+$/), firstCategoryLink.click()]);

    // Verify the category page heading contains the selected category name
    await expect(page.locator("h1")).toContainText(expectedTitle);
  });

  test("returns 404 for an unknown category", async ({ page }) => {
    const response = await page.goto("/bookshelf/this-category-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("user can open a resource detail page", async ({ page }) => {
    await page.goto("/bookshelf");

    // 1. Go to first category
    const firstCategoryLink = page.locator(".category-card-link").first();
    await expect(firstCategoryLink).toBeVisible();
    await Promise.all([page.waitForURL(/\/bookshelf\/[^/]+$/), firstCategoryLink.click()]);

    // 2. Click the first resource card details link
    const firstResourceLink = page
      .locator(".resource-grid .resource-card h2 a, .resource-grid .resource-card a")
      .first();
    await expect(firstResourceLink).toBeVisible();

    const expectedTitle = await firstResourceLink.innerText();

    await Promise.all([
      page.waitForURL(/\/bookshelf\/resource\/[^/]+$/),
      firstResourceLink.click(),
    ]);

    // 3. Verify h1 contains the title of the resource
    await expect(page.locator("h1")).toContainText(expectedTitle);
  });

  test("returns 404 for an unknown resource", async ({ page }) => {
    const response = await page.goto("/bookshelf/resource/this-resource-id-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
