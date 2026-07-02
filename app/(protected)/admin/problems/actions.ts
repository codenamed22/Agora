"use server";

import { requireAdmin } from "../../../../lib/guards";
import { isSupportedLanguage, runJudge } from "../../../../lib/judge";
import { prisma } from "../../../../lib/prisma";

type RunResult =
  | {
      ok: true;
      verdict: string;
      passedCount: number;
      totalCount: number;
      runtimeMs: number | null;
      failureMessage?: string | null;
    }
  | { ok: false; message: string };

function judgeFailureMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Could not run the judge. Check the judge service logs.";
  }

  if (error.message.includes("JUDGE_BASE_URL")) {
    return "Could not run the judge. JUDGE_BASE_URL is not configured.";
  }

  return `Could not run the judge. ${error.message}`;
}

export async function runReferenceSolution(slug: string, language?: string): Promise<RunResult> {
  await requireAdmin();

  const problem = await prisma.problem.findUnique({
    where: { slug },
    select: {
      solutionCode: true,
      solutionLanguage: true,
      referenceSolutions: {
        orderBy: { language: "asc" },
        select: { language: true, code: true },
      },
      timeLimitMs: true,
      testCases: { orderBy: { order: "asc" }, select: { input: true, expectedOutput: true } },
    },
  });

  if (!problem) {
    return { ok: false, message: "Problem not found." };
  }

  const references =
    problem.referenceSolutions.length > 0
      ? problem.referenceSolutions
      : problem.solutionCode
        ? [{ language: problem.solutionLanguage ?? "python", code: problem.solutionCode }]
        : [];
  const reference = language
    ? references.find((solution) => solution.language === language)
    : references[0];

  if (!reference) {
    return { ok: false, message: "No reference solution is stored for this problem." };
  }

  if (!isSupportedLanguage(reference.language)) {
    return { ok: false, message: `Unsupported solution language: ${reference.language}.` };
  }

  try {
    const result = await runJudge({
      code: reference.code,
      language: reference.language,
      testCases: problem.testCases,
      timeLimitMs: problem.timeLimitMs,
    });
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, message: judgeFailureMessage(error) };
  }
}
