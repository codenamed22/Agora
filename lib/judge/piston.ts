import { SUPPORTED_LANGUAGES } from "./languages";
import type { CodeExecutor, ExecutionResult } from "./types";

const OUTPUT_LIMIT = 20_000;

type PistonProcess = {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number | null;
  signal?: string | null;
};

type PistonResponse = {
  run?: PistonProcess;
  compile?: PistonProcess;
};

export const executeWithPiston: CodeExecutor = async ({ code, language, stdin, timeLimitMs }) => {
  const runtime = SUPPORTED_LANGUAGES[language];
  const baseUrl = process.env.JUDGE_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("JUDGE_BASE_URL must point to a self-hosted Piston API.");
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeLimitMs + 2_000);

  try {
    const headers: Record<string, string> = { "content-type": "application/json" };

    if (process.env.JUDGE_API_KEY) {
      headers.authorization = `Bearer ${process.env.JUDGE_API_KEY}`;
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/execute`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        language: runtime.pistonLanguage,
        version: process.env[`PISTON_${language.toUpperCase()}_VERSION`] ?? runtime.version,
        files: [{ content: code }],
        stdin,
        compile_timeout: timeLimitMs,
        run_timeout: timeLimitMs,
      }),
    });

    if (!response.ok) {
      throw new Error(`Piston request failed: ${response.status}`);
    }

    const data = (await response.json()) as PistonResponse;
    const compile = data.compile;
    const run = data.run;
    const compileOutput = `${compile?.stdout ?? ""}${compile?.stderr ?? ""}${compile?.output ?? ""}`;

    if (compile && compile.code && compile.code !== 0) {
      return {
        stdout: "",
        stderr: compileOutput.slice(0, OUTPUT_LIMIT),
        exitCode: compile.code,
        signal: compile.signal ?? null,
        runtimeMs: Date.now() - startedAt,
        compileError: compileOutput.slice(0, OUTPUT_LIMIT) || "Compilation failed.",
      } satisfies ExecutionResult;
    }

    return {
      stdout: (run?.stdout ?? "").slice(0, OUTPUT_LIMIT),
      stderr: (run?.stderr ?? run?.output ?? "").slice(0, OUTPUT_LIMIT),
      exitCode: typeof run?.code === "number" ? run.code : null,
      signal: run?.signal ?? null,
      runtimeMs: Date.now() - startedAt,
    } satisfies ExecutionResult;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        stdout: "",
        stderr: "Execution timed out.",
        exitCode: null,
        signal: null,
        runtimeMs: timeLimitMs,
        timedOut: true,
      };
    }

    throw error;
  } finally {
    clearTimeout(abortTimer);
  }
};
