// Backfills each Problem's reference solution from scripts/reference-solutions/<slug>.py
// into the live DB. Idempotent. Run: node --env-file=.env.local scripts/backfill-solutions.mjs
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const here = dirname(fileURLToPath(import.meta.url));
const solutionsDir = join(here, "reference-solutions");
const prisma = new PrismaClient();

const problems = await prisma.problem.findMany({ select: { id: true, slug: true } });

let updated = 0;
let missing = 0;
for (const problem of problems) {
  const file = join(solutionsDir, `${problem.slug}.py`);
  if (!existsSync(file)) {
    console.log(`MISSING ${problem.slug}`);
    missing += 1;
    continue;
  }
  await prisma.problem.update({
    where: { id: problem.id },
    data: { solutionCode: readFileSync(file, "utf8"), solutionLanguage: "python" },
  });
  updated += 1;
}

console.log(`Updated ${updated} problem(s); ${missing} missing solution file(s).`);
await prisma.$disconnect();
