import { SubmissionVerdict } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isSupportedLanguage, judgeSubmission, normalizeOutput } from "../../../lib/judge";
import type { CodeExecutor } from "../../../lib/judge/types";

describe("normalizeOutput", () => {
  it("normalizes line endings and trailing whitespace", () => {
    expect(normalizeOutput("5  \r\n\n")).toBe("5");
  });
});

describe("isSupportedLanguage", () => {
  it("allows the MVP languages only", () => {
    expect(isSupportedLanguage("python")).toBe(true);
    expect(isSupportedLanguage("cpp")).toBe(true);
    expect(isSupportedLanguage("ruby")).toBe(false);
  });
});

describe("judgeSubmission", () => {
  const testCases = [
    { input: "2 3\n", expectedOutput: "5\n" },
    { input: "-4 10\n", expectedOutput: "6\n" },
  ];

  it("accepts when every test matches", async () => {
    const executor: CodeExecutor = async ({ stdin }) => ({
      stdout: stdin.includes("2 3") ? "5\n" : "6\n",
      stderr: "",
      exitCode: 0,
      signal: null,
      runtimeMs: 3,
    });

    await expect(
      judgeSubmission({ code: "", executor, language: "python", testCases, timeLimitMs: 2000 }),
    ).resolves.toEqual({
      verdict: SubmissionVerdict.ACCEPTED,
      passedCount: 2,
      totalCount: 2,
      runtimeMs: 6,
    });
  });

  it("returns wrong answer on the first mismatched output", async () => {
    const executor: CodeExecutor = async () => ({
      stdout: "0\n",
      stderr: "",
      exitCode: 0,
      signal: null,
      runtimeMs: 1,
    });

    const result = await judgeSubmission({
      code: "",
      executor,
      language: "python",
      testCases,
      timeLimitMs: 2000,
    });

    expect(result).toMatchObject({ verdict: SubmissionVerdict.WRONG_ANSWER, passedCount: 0 });
  });

  it("maps compile errors before output comparison", async () => {
    const executor: CodeExecutor = async () => ({
      stdout: "",
      stderr: "compile failed",
      exitCode: 1,
      signal: null,
      runtimeMs: 1,
      compileError: "compile failed",
    });

    const result = await judgeSubmission({
      code: "",
      executor,
      language: "cpp",
      testCases,
      timeLimitMs: 2000,
    });

    expect(result).toMatchObject({ verdict: SubmissionVerdict.COMPILE_ERROR, passedCount: 0 });
  });

  it("maps timeouts to TLE", async () => {
    const executor: CodeExecutor = async () => ({
      stdout: "",
      stderr: "timeout",
      exitCode: null,
      signal: null,
      runtimeMs: 2000,
      timedOut: true,
    });

    const result = await judgeSubmission({
      code: "",
      executor,
      language: "python",
      testCases,
      timeLimitMs: 2000,
    });

    expect(result).toMatchObject({ verdict: SubmissionVerdict.TLE, passedCount: 0 });
  });
});
