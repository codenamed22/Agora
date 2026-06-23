import { expect, test } from "@playwright/test";
import { devLogin } from "./utils";

test.describe("route gating", () => {
  test("redirects anonymous users from /dashboard to /join", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/join");
    await expect(page).toHaveURL(/\/join$/);
  });

  test("redirects anonymous users from /admin/applications to /join", async ({ page }) => {
    await page.goto("/admin/applications");
    await page.waitForURL("**/join");
    await expect(page).toHaveURL(/\/join$/);
  });

  for (const path of ["/admin/teaching", "/masterclass", "/boards/missing-board"]) {
    test(`redirects anonymous users from ${path} to /join`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL("**/join");
      await expect(page).toHaveURL(/\/join$/);
    });
  }

  test("keeps a pending member out of active member routes", async ({ page }) => {
    await devLogin(page, "member");

    for (const path of [
      "/admin/applications",
      "/admin/teaching",
      "/masterclass",
      "/boards/missing-board",
    ]) {
      await page.goto(path);
      await page.waitForURL("**/apply");
      await expect(page).toHaveURL(/\/apply$/);
    }
  });

  test("lets an admin reach the application review page", async ({ page }) => {
    await devLogin(page, "admin");
    await page.goto("/admin/applications");
    await expect(page.getByRole("heading", { name: "Application review" })).toBeVisible();
  });

  test("redirects old admin teaching page to masterclass for admins", async ({ page }) => {
    await devLogin(page, "admin");
    await page.goto("/admin/teaching");
    await page.waitForURL("**/masterclass");
    await expect(page.getByRole("heading", { name: "Masterclass sessions" })).toBeVisible();
  });
});
