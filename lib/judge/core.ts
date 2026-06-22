import { SubmissionVerdict } from "@prisma/client";
import type { CodeExecutor, JudgeResult, JudgeTestCase } from "./types";
import type { SupportedLanguage } from "./languages";

export function normalizeOutput(output: string) {
  return output
    .replace(/[ \t]+$/gm, "")
    .replace(/\r\n/g, "\n")
    .trimEnd();
}

export async function judgeSubmission({
  code,
  executor,
  language,
  testCases,
  timeLimitMs,
}: {
  code: string;
  executor: CodeExecutor;
  language: SupportedLanguage;
  testCases: JudgeTestCase[];
  timeLimitMs: number;
}): Promise<JudgeResult> {
  let passedCount = 0;
  let runtimeMs = 0;

  for (const testCase of testCases) {
    const result = await executor({ language, code, stdin: testCase.input, timeLimitMs });

    if (typeof result.runtimeMs === "number") {
      runtimeMs += result.runtimeMs;
    }

    if (result.compileError) {
      return {
        verdict: SubmissionVerdict.COMPILE_ERROR,
        passedCount,
        totalCount: testCases.length,
        runtimeMs,
      };
    }

    if (result.timedOut || result.signal === "SIGKILL" || result.signal === "SIGTERM") {
      return {
        verdict: SubmissionVerdict.TLE,
        passedCount,
        totalCount: testCases.length,
        runtimeMs,
      };
    }

    if (result.exitCode !== 0) {
      return {
        verdict: SubmissionVerdict.RUNTIME_ERROR,
        passedCount,
        totalCount: testCases.length,
        runtimeMs,
      };
    }

    if (normalizeOutput(result.stdout) !== normalizeOutput(testCase.expectedOutput)) {
      return {
        verdict: SubmissionVerdict.WRONG_ANSWER,
        passedCount,
        totalCount: testCases.length,
        runtimeMs,
      };
    }

    passedCount += 1;
  }

  return {
    verdict: SubmissionVerdict.ACCEPTED,
    passedCount,
    totalCount: testCases.length,
    runtimeMs,
  };
}
