// Syncs problem test cases in the DB to match prisma/seed.js without running the
// full seed (which would touch unrelated data). Fixes the gas-station expected
// output and appends the shared hidden edge-case and stress tests. Idempotent
// (matches by input).
//
// Run: node --env-file=.env.local scripts/sync-problem-tests.mjs
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const hiddenTests = require("../prisma/hidden-tests.json");
const { buildStressTests } = require("../prisma/hidden-stress-tests.js");
const stressTests = buildStressTests();

const prisma = new PrismaClient();

// 1. Correct the wrong gas-station hidden test (expected 0 -> 2).
const gasFix = await prisma.testCase.updateMany({
  where: { problem: { slug: "gas-station" }, input: "4\n5 1 2 3\n4 4 1 2\n" },
  data: { expectedOutput: "2\n" },
});
console.log(`gas-station fix: updated ${gasFix.count} test case(s)`);

// 2. Append hidden tests, skipping any already present (by input).
let added = 0;
const hiddenSuiteTests = new Map();

for (const [slug, tests] of Object.entries(hiddenTests)) {
  hiddenSuiteTests.set(slug, [...tests]);
}

for (const [slug, tests] of Object.entries(stressTests)) {
  hiddenSuiteTests.set(slug, [...(hiddenSuiteTests.get(slug) ?? []), ...tests]);
}

for (const [slug, tests] of hiddenSuiteTests) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    select: { id: true, testCases: { select: { input: true, order: true } } },
  });
  if (!problem) {
    console.log(`SKIP ${slug}: not found`);
    continue;
  }

  const existingInputs = new Set(problem.testCases.map((t) => t.input));
  let nextOrder = Math.max(0, ...problem.testCases.map((t) => t.order)) + 1;

  for (const test of tests) {
    if (existingInputs.has(test.input)) {
      continue;
    }
    await prisma.testCase.create({
      data: {
        problemId: problem.id,
        input: test.input,
        expectedOutput: test.expectedOutput,
        isSample: false,
        order: nextOrder,
      },
    });
    nextOrder += 1;
    added += 1;
  }
}

console.log(`Added ${added} new test case(s).`);
await prisma.$disconnect();
