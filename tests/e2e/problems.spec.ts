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
    await expect(page.getByRole("link", { name: "Practice" })).toHaveAttribute("href", "/practice");
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

    await page.goto("/problems");
    await expect(page.locator(".problem-row", { hasText: TEST_PROBLEM_TITLE })).toContainText(
      "1 accepted",
    );
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.locator(".practice-leaderboard-header")).toContainText("Score");
    await expect(
      page.locator(".leaderboard-row", { hasText: "Local Admin" }).locator(".leaderboard-score"),
    ).toHaveText("1");
  });

  test("shows the prompt and editor side by side on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await devLogin(page, "admin");
    await page.goto(`/problems/${TEST_PROBLEM_SLUG}`);

    const promptPane = page.locator(".practice-prompt-pane");
    const submitPane = page.locator(".practice-submit-pane");
    await expect(promptPane).toBeVisible();
    await expect(submitPane).toBeVisible();
    await expect(page.locator(".cm-editor")).toBeVisible();

    const promptBox = await promptPane.boundingBox();
    const submitBox = await submitPane.boundingBox();
    expect(promptBox).not.toBeNull();
    expect(submitBox).not.toBeNull();
    expect(promptBox!.x + promptBox!.width).toBeLessThanOrEqual(submitBox!.x + 1);
  });

  test("stacks the practice workspace on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await devLogin(page, "admin");
    await page.goto(`/problems/${TEST_PROBLEM_SLUG}`);

    const promptPane = page.locator(".practice-prompt-pane");
    const submitPane = page.locator(".practice-submit-pane");
    await expect(promptPane).toBeVisible();
    await expect(submitPane).toBeVisible();
    await expect(page.getByLabel("Language")).toBeVisible();
    await expect(page.locator(".cm-editor")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit solution" })).toBeVisible();

    const promptBox = await promptPane.boundingBox();
    const submitBox = await submitPane.boundingBox();
    expect(promptBox).not.toBeNull();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.y).toBeGreaterThan(promptBox!.y);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("toggles between the Description and Submissions tabs", async ({ page }) => {
    await page.goto(`/problems/${TEST_PROBLEM_SLUG}`);

    const descriptionPanel = page.locator("#panel-description");
    const submissionsPanel = page.locator("#panel-submissions");

    await expect(descriptionPanel).toBeVisible();
    await expect(submissionsPanel).toBeHidden();

    await page.getByRole("tab", { name: "Submissions" }).click();
    await expect(submissionsPanel).toBeVisible();
    await expect(descriptionPanel).toBeHidden();

    await page.getByRole("tab", { name: "Description" }).click();
    await expect(descriptionPanel).toBeVisible();
    await expect(submissionsPanel).toBeHidden();
  });

  test("editor fills the solution pane on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await devLogin(page, "admin");
    await page.goto(`/problems/${TEST_PROBLEM_SLUG}`);

    const editor = page.locator(".cm-editor");
    await expect(editor).toBeVisible();
    const box = await editor.boundingBox();
    expect(box).not.toBeNull();
    // Flex-fill should give the editor most of the pane height, not a small fixed box.
    expect(box!.height).toBeGreaterThan(320);
  });

  test("shows expandable runtime error details", async ({ page }) => {
    await devLogin(page, "admin");
    await page.goto(`/problems/${TEST_PROBLEM_SLUG}`);

    await page.getByLabel("Language").selectOption("python");
    await page.locator(".cm-content").fill("RUNTIME_ERROR");
    await page.getByRole("button", { name: "Submit solution" }).click();

    const runtimeError = page.locator(".submission-details", { hasText: "Runtime error" }).first();
    await expect(runtimeError).toBeVisible();
    await runtimeError.locator("summary").click();
    await expect(runtimeError.locator(".submission-failure-message")).toContainText(
      "fake runtime error",
    );
  });
});
