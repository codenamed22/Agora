import type { CodeExecutor } from "./types";

export const executeWithFakeJudge: CodeExecutor = async ({ code, stdin }) => {
  await new Promise((resolve) => setTimeout(resolve, 75));

  if (code.includes("COMPILE_ERROR")) {
    return {
      stdout: "",
      stderr: "fake compile error",
      exitCode: 1,
      signal: null,
      runtimeMs: 1,
      compileError: "fake compile error",
    };
  }

  if (code.includes("RUNTIME_ERROR")) {
    return { stdout: "", stderr: "fake runtime error", exitCode: 1, signal: null, runtimeMs: 1 };
  }

  if (code.includes("TIME_LIMIT")) {
    return {
      stdout: "",
      stderr: "fake timeout",
      exitCode: null,
      signal: null,
      runtimeMs: 1,
      timedOut: true,
    };
  }

  if (code.includes("WRONG_ANSWER")) {
    return { stdout: "wrong\n", stderr: "", exitCode: 0, signal: null, runtimeMs: 1 };
  }

  const numbers = stdin
    .trim()
    .split(/\s+/)
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value));
  const sum = numbers.reduce((total, value) => total + value, 0);

  return { stdout: `${sum}\n`, stderr: "", exitCode: 0, signal: null, runtimeMs: 1 };
};
