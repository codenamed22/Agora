import { expect, test } from "@playwright/test";
import { TEST_PROBLEM_SLUG, TEST_PROBLEM_TITLE } from "./env";
import { devLogin } from "./utils";

test.describe("problems", () => {
  test("lists the seeded problem and prompts anonymous users to sign in", async ({ page }) => {
    await page.goto("/problems");

    const row = page.locator(".problem-row", { hasText: TEST_PROBLEM_TITLE });
    await expect(row).toBeVisible();
    await expect(row).not.toContainText("2000ms");
    await row.click();

    await expect(page).toHaveURL(`/problems/${TEST_PROBLEM_SLUG}`);
    await expect(page.getByRole("heading", { name: TEST_PROBLEM_TITLE })).toBeVisible();
    await expect(page.getByRole("link", { name: "Events" })).toHaveAttribute("href", "/events");
    await expect(page.getByRole("link", { name: "Practice" })).toHaveAttribute("href", "/problems");
    await expect(page.locator(".problem-tag-list")).toContainText("Math");
    await expect(page.locator(".problem-tag-list")).toContainText("Warm-up");
    await expect(page.locator(".problem-tag-list")).not.toContainText("2000ms");
    await expect(page.locator(".problem-tag-list")).not.toContainText("stdin/stdout");
    await expect(page.getByRole("link", { name: "Sign in to submit" })).toHaveAttribute(
      "href",
      "/join",
    );
  });

  test("redirects pending members to finish their application", async ({ page }) => {
    await devLogin(page, "member");
    await page.goto(`/problems/${TEST_PROBLEM_SLUG}`);

    await expect(page.getByRole("link", { name: "Finish application to submit" })).toHaveAttribute(
      "href",
      "/apply",
    );
  });

  test("lets an active admin submit and see an accepted verdict", async ({ page }) => {
    await devLogin(page, "admin");
    await page.goto(`/problems/${TEST_PROBLEM_SLUG}`);

    await page.getByLabel("Language").selectOption("python");
    await page.locator(".cm-content").fill("print('fake judge accepts by summing stdin')");
    await page.getByRole("button", { name: "Submit solution" }).click();

    await expect(page.getByRole("button", { name: "Running tests..." })).toBeVisible();
    await expect(page.locator(".running-submission")).toContainText("Pending");
    await expect(page.getByText("Accepted").first()).toBeVisible();
    await expect(page.getByText("2/2 tests").first()).toBeVisible();
  });
});
