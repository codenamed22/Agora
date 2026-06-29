import { expect, test } from "@playwright/test";
import { devLogin } from "./utils";

test.describe("bookshelf", () => {
  test("anonymous user can view the bookshelf", async ({ page }) => {
    await page.goto("/bookshelf");
    await expect(page.locator("h1")).toContainText("Bookshelf");
  });

  test("admin can manage categories and resources", async ({ page }) => {
    // 1. Login as admin
    await devLogin(page, "admin");

    // 2. Go to category management page
    await page.goto("/admin/bookshelf/categories");
    await expect(page.locator("h1")).toContainText("Category management");

    // 3. Create a new category
    const catName = "E2E Test Category";
    const catSlug = "e2e-test-category";
    await page.fill('input[name="name"]', catName);
    await page.fill('input[name="slug"]', catSlug);
    await page.click('button[type="submit"]:has-text("Create Category")');

    // 4. Verify category created successfully
    await expect(page.locator(".form-message")).toContainText("Category successfully created!");
    await expect(page.locator(".application-row", { hasText: catName })).toBeVisible();

    // 5. Go to add resource page
    await page.goto("/admin/bookshelf/new");
    await expect(page.locator("h1")).toContainText("Add learning resource");

    // 6. Fill resource form
    await page.fill('input[name="title"]', "E2E Test Resource Book");
    await page.fill('input[name="author"]', "E2E Test Author");
    await page.selectOption('select[name="type"]', "BOOK");
    await page.selectOption('select[name="categoryId"]', { label: catName });
    await page.fill('textarea[name="recommendationReason"]', "This is an E2E test recommendation");
    await page.fill('input[name="imageUrl"]', "https://example.com/cover.jpg");
    await page.click('button[type="submit"]:has-text("Save Resource")');

    // 7. Verify resource created successfully
    await page.waitForURL("**/admin/bookshelf?success=resource-created");
    await expect(page.locator(".form-message")).toContainText("Resource successfully created!");
    await expect(page.locator(".application-row", { hasText: "E2E Test Resource Book" })).toBeVisible();

    // 8. Go to public bookshelf page and verify resource is listed
    await page.goto("/bookshelf");
    await expect(page.locator(".resource-card", { hasText: "E2E Test Resource Book" })).toBeVisible();

    // 9. Go to resource detail page
    await page.click('a:has-text("E2E Test Resource Book")');
    await expect(page.locator("h1")).toContainText("E2E Test Resource Book");

    // 10. Delete the resource (with confirm dialog confirmation)
    await page.goto("/admin/bookshelf");
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Are you sure you want to delete this resource?");
      await dialog.accept();
    });
    const resourceRow = page.locator(".application-row", { hasText: "E2E Test Resource Book" });
    await resourceRow.getByRole("button", { name: "Delete" }).click();

    // Verify deletion message
    await expect(page.locator(".form-message")).toContainText("Resource successfully deleted");

    // 11. Delete the category (with confirm dialog confirmation)
    await page.goto("/admin/bookshelf/categories");
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to delete category "E2E Test Category"?');
      await dialog.accept();
    });
    const categoryRow = page.locator(".application-row", { hasText: catName });
    await categoryRow.getByRole("button", { name: "Delete" }).click();

    // Verify category deletion message
    await expect(page.locator(".form-message")).toContainText("Category successfully deleted");
  });
});
