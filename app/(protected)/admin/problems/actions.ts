"use server";

import { requireAdmin } from "../../../../lib/guards";
import { isSupportedLanguage, runJudge } from "../../../../lib/judge";
import { prisma } from "../../../../lib/prisma";

type RunResult =
  | { ok: true; verdict: string; passedCount: number; totalCount: number; runtimeMs: number | null }
  | { ok: false; message: string };

export async function runReferenceSolution(slug: string): Promise<RunResult> {
  await requireAdmin();

  const problem = await prisma.problem.findUnique({
    where: { slug },
    select: {
      solutionCode: true,
      solutionLanguage: true,
      timeLimitMs: true,
      testCases: { orderBy: { order: "asc" }, select: { input: true, expectedOutput: true } },
    },
  });

  if (!problem?.solutionCode) {
    return { ok: false, message: "No reference solution is stored for this problem." };
  }

  const language = problem.solutionLanguage ?? "python";

  if (!isSupportedLanguage(language)) {
    return { ok: false, message: `Unsupported solution language: ${language}.` };
  }

  try {
    const result = await runJudge({
      code: problem.solutionCode,
      language,
      testCases: problem.testCases,
      timeLimitMs: problem.timeLimitMs,
    });
    return { ok: true, ...result };
  } catch {
    return { ok: false, message: "Could not run the judge. Is JUDGE_BASE_URL configured?" };
  }
}
