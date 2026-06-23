import { expect, test } from "@playwright/test";
import { devLogin } from "./utils";

test.describe("homepage navigation", () => {
  test("shows Join for anonymous visitors", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Join" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveCount(0);

    const cta = page.getByRole("link", { name: "Join the community" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/join");
  });

  test("shows authenticated nav and CTA for an admin", async ({ page }) => {
    await devLogin(page, "admin");
    await page.goto("/");

    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Masterclass" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Admin" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Join" })).toHaveCount(0);

    const cta = page.getByRole("link", { name: "Go to dashboard" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/dashboard");
  });
});
