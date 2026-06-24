import { SubmissionVerdict } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isSupportedLanguage, judgeSubmission, normalizeOutput } from "../../../lib/judge";
import { executeWithPiston } from "../../../lib/judge/piston";
import type { CodeExecutor } from "../../../lib/judge/types";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.JUDGE_BASE_URL;
});

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

describe("executeWithPiston", () => {
  it("gives C++ compilation room beyond the run timeout", async () => {
    process.env.JUDGE_BASE_URL = "https://judge.example.test/api/v2";
    let payload: { compile_timeout: number; run_timeout: number } | undefined;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      payload = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ run: { stdout: "5\n", code: 0 } }), { status: 200 });
    });

    await executeWithPiston({ code: "", language: "cpp", stdin: "2 3\n", timeLimitMs: 2000 });

    expect(payload).toMatchObject({ compile_timeout: 10_000, run_timeout: 2000 });
  });

  it("treats compiler stderr limit failures as compile errors", async () => {
    process.env.JUDGE_BASE_URL = "https://judge.example.test/api/v2";

    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          compile: {
            stderr: "file0.code.cpp: error: 'cin' was not declared in this scope",
            code: null,
            signal: "SIGKILL",
            status: "EL",
            message: "stderr length exceeded",
          },
        }),
        { status: 200 },
      );
    });

    const result = await executeWithPiston({
      code: "",
      language: "cpp",
      stdin: "",
      timeLimitMs: 2000,
    });

    expect(result.compileError).toContain("cin");
    expect(result.signal).toBe("SIGKILL");
  });
});
