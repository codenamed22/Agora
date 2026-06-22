// Shared configuration for the end-to-end suite.
// Defaults to the docker-compose Postgres URL; override DATABASE_URL to point elsewhere.
export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/shardup?schema=public";

// Deterministic fixture seeded by global-setup and asserted by the specs.
export const TEST_EVENT_TITLE = "E2E Automated Test Event";
export const TEST_PROBLEM_SLUG = "e2e-sum-two-numbers";
export const TEST_PROBLEM_TITLE = "E2E Sum Two Numbers";
