import { expect, test } from "@playwright/test";
import { TEST_BOOK_SUBMISSION_TITLE, TEST_REJECTED_SUBMISSION_TITLE } from "./env";
import { devLogin } from "./utils";

test.describe("bookshelf submissions", () => {
  test("requires an active member to open the submission form", async ({ page }) => {
    await page.goto("/bookshelf/submit");
    await expect(page).toHaveURL(/\/join$/);

    await devLogin(page, "member");
    await page.goto("/bookshelf/submit");
    await expect(page).toHaveURL(/\/apply$/);
  });

  test("keeps a recommendation pending until an admin approves it", async ({ page }) => {
    await devLogin(page, "active");
    await page.goto("/bookshelf/submit");

    await page.getByLabel("Resource type").selectOption("BOOK");
    await page.getByLabel("Title").fill(TEST_BOOK_SUBMISSION_TITLE);
    await page.getByLabel("Author", { exact: true }).fill("E2E Author");
    await page.getByLabel("Category").selectOption({ label: "System Design" });
    await page
      .getByLabel("Why do you recommend it?")
      .fill("A deterministic recommendation used to verify the complete moderation workflow.");
    await page.getByLabel("Book information URL").fill("https://example.com/e2e-book");
    await page.getByLabel("Buy link (optional)").fill("https://example.com/e2e-book/buy");
    await page.getByRole("button", { name: "Submit for review" }).click();

    await expect(page.getByRole("status")).toContainText("Submitted for review");

    await page.goto("/bookshelf/system-design");
    await expect(page.getByText(TEST_BOOK_SUBMISSION_TITLE, { exact: true })).toHaveCount(0);

    await page.context().clearCookies();
    await devLogin(page, "admin");
    await page.goto("/admin/bookshelf");

    const submission = page
      .locator(".resource-submission-admin-row")
      .filter({ hasText: TEST_BOOK_SUBMISSION_TITLE });
    await expect(submission).toContainText("Local Member");
    await expect(submission.getByRole("link", { name: "Check resource" })).toHaveAttribute(
      "href",
      "https://example.com/e2e-book",
    );
    await submission.getByRole("button", { name: "Approve and publish" }).click();
    await expect(page.getByRole("status")).toContainText("approved");

    await page.goto("/bookshelf/system-design");
    await page.getByRole("link", { name: TEST_BOOK_SUBMISSION_TITLE }).click();
    await expect(page.getByText("Recommended By")).toBeVisible();
    await expect(page.getByText("Local Member")).toBeVisible();
  });

  test("an admin can reject a recommendation without publishing it", async ({ page }) => {
    await devLogin(page, "active");
    await page.goto("/bookshelf/submit");

    await page.getByLabel("Title").fill(TEST_REJECTED_SUBMISSION_TITLE);
    await page.getByLabel("Author").fill("E2E Author");
    await page.getByLabel("Category").selectOption({ label: "System Design" });
    await page
      .getByLabel("Why do you recommend it?")
      .fill("This recommendation is intentionally rejected by the end-to-end moderation test.");
    await page.getByLabel("Open-access PDF URL").fill("https://example.com/e2e-rejected-paper.pdf");
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByRole("status")).toContainText("Submitted for review");

    await page.context().clearCookies();
    await devLogin(page, "admin");
    await page.goto("/admin/bookshelf");
    const submission = page
      .locator(".resource-submission-admin-row")
      .filter({ hasText: TEST_REJECTED_SUBMISSION_TITLE });
    await submission.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByRole("status")).toContainText("rejected");

    await page.goto("/bookshelf/system-design");
    await expect(page.getByText(TEST_REJECTED_SUBMISSION_TITLE, { exact: true })).toHaveCount(0);
  });
});
