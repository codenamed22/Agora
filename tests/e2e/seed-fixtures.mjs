// Seeds a deterministic, always-future event and a fixed problem so the e2e
// suite has stable data regardless of the current date or DB contents.
//
// Run via tsx from global-setup (in its own process) so the ESM/TypeScript
// generated Prisma Client loads correctly instead of Playwright's CJS loader.
import { PrismaClient } from "../../lib/generated/prisma/client.ts";
import { createPrismaAdapter } from "../../lib/prisma-adapter.ts";
import {
  DATABASE_URL,
  TEST_BOOK_SUBMISSION_TITLE,
  TEST_EVENT_TITLE,
  TEST_PROBLEM_SLUG,
  TEST_PROBLEM_TITLE,
  TEST_REJECTED_SUBMISSION_TITLE,
} from "./env.ts";

const PYTHON_SUM_REFERENCE = `import sys

a, b = map(int, sys.stdin.read().split())
print(a + b)
`;

const CPP_SUM_REFERENCE = `#include <iostream>
using namespace std;

int main() {
  long long a, b;
  cin >> a >> b;
  cout << a + b << '\\n';
  return 0;
}
`;

const prisma = new PrismaClient({ adapter: createPrismaAdapter(DATABASE_URL) });

try {
  // Recreate from scratch so RSVPs from a previous run are cleared (cascade).
  await prisma.event.deleteMany({ where: { title: TEST_EVENT_TITLE } });
  await prisma.event.create({
    data: {
      title: TEST_EVENT_TITLE,
      description: "Deterministic event used by the end-to-end suite.",
      location: "Online",
      startsAt: new Date("2999-01-01T17:30:00.000Z"),
      endsAt: new Date("2999-01-01T18:30:00.000Z"),
      published: true,
    },
  });

  await prisma.problem.deleteMany({ where: { slug: TEST_PROBLEM_SLUG } });
  await prisma.problem.create({
    data: {
      slug: TEST_PROBLEM_SLUG,
      title: TEST_PROBLEM_TITLE,
      statement: "Read two integers and print their sum.",
      constraints: "-100 <= a, b <= 100",
      tags: ["Math", "Warm-up"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      solutionCode: PYTHON_SUM_REFERENCE,
      solutionLanguage: "python",
      referenceSolutions: {
        create: [
          { language: "python", code: PYTHON_SUM_REFERENCE },
          { language: "cpp", code: CPP_SUM_REFERENCE },
        ],
      },
      testCases: {
        create: [
          { input: "2 3\n", expectedOutput: "5\n", isSample: true, order: 1 },
          { input: "-4 10\n", expectedOutput: "6\n", isSample: false, order: 2 },
        ],
      },
    },
  });

  const bookshelfCategory = await prisma.category.upsert({
    where: { slug: "system-design" },
    update: { name: "System Design" },
    create: { name: "System Design", slug: "system-design" },
  });
  await prisma.resourceSubmission.deleteMany({
    where: { title: { in: [TEST_BOOK_SUBMISSION_TITLE, TEST_REJECTED_SUBMISSION_TITLE] } },
  });
  await prisma.resource.deleteMany({
    where: {
      categoryId: bookshelfCategory.id,
      title: { in: [TEST_BOOK_SUBMISSION_TITLE, TEST_REJECTED_SUBMISSION_TITLE] },
    },
  });
} finally {
  await prisma.$disconnect();
}
