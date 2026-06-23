import { expect, test } from "@playwright/test";
import { devLogin } from "./utils";

test.describe("masterclass sessions", () => {
  test("lets an admin create a session and manage an artifact", async ({ page }) => {
    const title = `E2E masterclass session ${Date.now()}`;
    const artifactUrl = "https://docs.google.com/document/d/e2e-teaching-notes";

    await devLogin(page, "admin");
    await page.goto("/masterclass");

    await page.getByLabel("Session title").fill(title);
    await page.getByLabel("Topic or notes").fill("Practice session notes");
    await page.getByLabel("Session date").fill("2999-01-02");
    await page.getByRole("button", { name: "Start new masterclass session" }).click();

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(
      page.getByRole("paragraph").filter({ hasText: "Practice session notes" }),
    ).toBeVisible();

    await page.getByLabel("Artifact type").selectOption("SLIDES");
    await page.getByLabel("Label").fill("Teaching notes");
    await page.getByLabel("Artifact URL").fill(artifactUrl);
    await page.getByRole("button", { name: "Add artifact" }).click();

    await expect(page.getByRole("heading", { name: "Teaching notes" })).toBeVisible();
    await expect(page.getByRole("link", { name: artifactUrl })).toBeVisible();

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("link", { name: artifactUrl })).toHaveCount(0);

    const boardTitle = `Board ${Date.now()}`;
    await page.getByLabel("Board title").fill(boardTitle);
    await page.getByRole("button", { name: "Create Excalidraw board" }).click();

    await expect(page.getByRole("heading", { name: boardTitle })).toBeVisible();
    await expect(page.getByTestId("excalidraw-board")).toBeVisible();

    await page.getByRole("button", { name: "Save board" }).click();
    await expect(page.getByText("Saved")).toBeVisible();

    const boardId = page.url().split("/").pop();
    await page.goto(`/boards/${boardId}`);
    await expect(page.getByRole("heading", { name: boardTitle })).toBeVisible();
    await expect(page.getByTestId("excalidraw-board")).toBeVisible();
  });
});
