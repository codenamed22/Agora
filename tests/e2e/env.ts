// Shared configuration for the end-to-end suite.
// Defaults to the docker-compose Postgres URL; override DATABASE_URL to point elsewhere.
export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/shardup?schema=public";

// Deterministic fixture seeded by global-setup and asserted by the specs.
export const TEST_EVENT_TITLE = "E2E Automated Test Event";
export const TEST_PROBLEM_SLUG = "e2e-sum-two-numbers";
export const TEST_PROBLEM_TITLE = "E2E Sum Two Numbers";
export const TEST_PAPER_TITLE = "E2E Research Paper";
export const TEST_UNAVAILABLE_PAPER_TITLE = "E2E Unavailable Research Paper";
export const TEST_BOOK_SUBMISSION_TITLE = "E2E Distributed Systems Book";
export const TEST_REJECTED_SUBMISSION_TITLE = "E2E Rejected Research Paper";
