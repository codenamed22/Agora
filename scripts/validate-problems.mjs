// Validates every problem's stored test cases against every stored reference
// solution. Reads problems from the DB (read-only), runs each reference on every
// test input, and diffs the output using the judge's normalizeOutput rules.
//
// Run: node --env-file=.env.local scripts/validate-problems.mjs
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const here = dirname(fileURLToPath(import.meta.url));
const solutionsDir = join(here, "reference-solutions");
const requiredLanguages = ["python", "cpp"];
const languageExtensions = {
  python: "py",
  cpp: "cpp",
};
const cppCompiler = process.env.CXX ?? "c++";

// Mirror of lib/judge/core.ts normalizeOutput.
function normalizeOutput(output) {
  return output
    .replace(/[ \t]+$/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/, "");
}

const prisma = new PrismaClient();

const problems = await prisma.problem.findMany({
  orderBy: { createdAt: "asc" },
  select: {
    slug: true,
    timeLimitMs: true,
    solutionCode: true,
    solutionLanguage: true,
    referenceSolutions: {
      orderBy: { language: "asc" },
      select: { language: true, code: true },
    },
    testCases: {
      orderBy: { order: "asc" },
      select: { input: true, expectedOutput: true, isSample: true, order: true },
    },
  },
});

let failures = 0;
let missing = 0;
const tempDir = mkdtempSync(join(tmpdir(), "shardup-references-"));

function referencesForProblem(problem) {
  const references = [...problem.referenceSolutions];
  if (references.length === 0 && problem.solutionCode) {
    references.push({
      language: problem.solutionLanguage ?? "python",
      code: problem.solutionCode,
    });
  }
  return references;
}

function compileReference(problem, reference) {
  if (reference.language === "python") {
    const file = join(tempDir, `${problem.slug}.py`);
    writeFileSync(file, reference.code);
    return { command: "python3", args: [file] };
  }

  if (reference.language === "cpp") {
    const sourceFile = join(tempDir, `${problem.slug}.cpp`);
    const binaryFile = join(tempDir, `${problem.slug}.out`);
    writeFileSync(sourceFile, reference.code);
    const compile = spawnSync(
      cppCompiler,
      ["-std=c++17", "-O2", "-pipe", sourceFile, "-o", binaryFile],
      { encoding: "utf8", timeout: 20_000 },
    );

    if (compile.status !== 0) {
      return {
        compileError: compile.stderr?.trim() || compile.error?.message || "C++ compile failed",
      };
    }

    return { command: binaryFile, args: [] };
  }

  return { compileError: `Unsupported reference language: ${reference.language}` };
}

try {
  for (const problem of problems) {
    const references = referencesForProblem(problem);
    const referencesByLanguage = new Map(
      references.map((reference) => [reference.language, reference]),
    );

    for (const language of requiredLanguages) {
      if (!referencesByLanguage.has(language)) {
        const extension = languageExtensions[language];
        const file = extension ? join(solutionsDir, `${problem.slug}.${extension}`) : null;
        console.log(`MISSING ${language} reference for ${problem.slug}`);
        if (file && !existsSync(file)) {
          console.log(`       expected file: ${file}`);
        }
        missing += 1;
      }
    }

    for (const language of requiredLanguages) {
      const reference = referencesByLanguage.get(language);
      if (!reference) {
        continue;
      }

      const executable = compileReference(problem, reference);
      if (executable.compileError) {
        failures += 1;
        console.log(`FAIL ${problem.slug} [${language}] compile`);
        console.log(`       ${executable.compileError}`);
        continue;
      }

      const badTests = [];
      for (const test of problem.testCases) {
        const run = spawnSync(executable.command, executable.args, {
          input: test.input,
          encoding: "utf8",
          timeout: Math.max(5000, problem.timeLimitMs + 3000),
        });

        if (run.status !== 0) {
          badTests.push({
            test,
            actual: `<<error: ${run.stderr?.trim() || run.error?.message || "non-zero exit"}>>`,
          });
          continue;
        }

        const actual = normalizeOutput(run.stdout);
        const expected = normalizeOutput(test.expectedOutput);
        if (actual !== expected) {
          badTests.push({ test, actual });
        }
      }

      if (badTests.length === 0) {
        console.log(`OK   ${problem.slug} [${language}] (${problem.testCases.length} tests)`);
      } else {
        failures += badTests.length;
        console.log(
          `FAIL ${problem.slug} [${language}] — ${badTests.length}/${problem.testCases.length} mismatch`,
        );
        for (const { test, actual } of badTests) {
          console.log(`     test#${test.order} (${test.isSample ? "sample" : "hidden"})`);
          console.log(`       input    : ${JSON.stringify(test.input)}`);
          console.log(`       expected : ${JSON.stringify(normalizeOutput(test.expectedOutput))}`);
          console.log(`       reference: ${JSON.stringify(actual)}`);
        }
      }
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  await prisma.$disconnect();
}

console.log(
  `\n${problems.length} problems, ${failures} reference failure(s), ${missing} missing reference(s).`,
);
process.exit(failures > 0 || missing > 0 ? 1 : 0);
