import { defineConfig, devices } from "@playwright/test";
import { DATABASE_URL } from "./tests/e2e/env";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // RSVP specs mutate shared DB state, so run serially for determinism.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL,
      LOCAL_DEV_AUTH_ENABLED: "true",
      ADMIN_EMAILS: "admin@shardup.local",
      AUTH_SECRET: "e2e-playwright-secret",
      AUTH_TRUST_HOST: "true",
      JUDGE_PROVIDER: "fake",
    },
  },
});
