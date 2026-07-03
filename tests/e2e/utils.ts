import { type Page } from "@playwright/test";

type DevRole = "admin" | "member";

// Uses the app's own development-only sign-in route. The route signs the user
// in server-side and redirects: admin -> /admin/cohort, member -> /apply.
export async function devLogin(page: Page, role: DevRole) {
  await page.goto(`/dev-login?role=${role}`);
  await page.waitForURL(role === "admin" ? "**/admin/cohort" : "**/apply");
}
