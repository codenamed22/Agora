import { SubmissionVerdict } from "@prisma/client";
import type { CodeExecutor, JudgeResult, JudgeTestCase } from "./types";
import type { SupportedLanguage } from "./languages";

const FAILURE_MESSAGE_LIMIT = 4_000;
const HIDDEN_RUNTIME_ERROR_MESSAGE =
  "Runtime error on a hidden test. Check edge cases and input handling.";

function truncateFailureMessage(message: string) {
  const normalized = message.trim();
  return normalized.length > FAILURE_MESSAGE_LIMIT
    ? `${normalized.slice(0, FAILURE_MESSAGE_LIMIT)}...`
    : normalized;
}

function runtimeFailureMessage(result: Awaited<ReturnType<CodeExecutor>>, isSample?: boolean) {
  if (!isSample) {
    return HIDDEN_RUNTIME_ERROR_MESSAGE;
  }

  const detail = result.stderr.trim();
  if (detail) {
    return truncateFailureMessage(detail);
  }

  if (typeof result.exitCode === "number") {
    return `Program exited with code ${result.exitCode}.`;
  }

  if (result.signal) {
    return `Program exited with signal ${result.signal}.`;
  }

  return "Program failed at runtime.";
}

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
        failureMessage: truncateFailureMessage(result.compileError),
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
        failureMessage: runtimeFailureMessage(result, testCase.isSample),
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
