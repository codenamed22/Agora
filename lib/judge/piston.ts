import { SUPPORTED_LANGUAGES } from "./languages";
import type { CodeExecutor, ExecutionResult } from "./types";
import { injectTimingLogic, cleanStdout } from "./timer";

const OUTPUT_LIMIT = 2_000_000;
const COMPILE_TIMEOUT_MS = 10_000;

type PistonProcess = {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number | null;
  signal?: string | null;
  status?: string | null;
  message?: string | null;
};

type PistonResponse = {
  run?: PistonProcess;
  compile?: PistonProcess;
};

function isPistonTimeout(process?: PistonProcess) {
  return process?.status === "TO" || process?.message === "Time limit exceeded (wall clock)";
}

export const executeWithPiston: CodeExecutor = async ({ code, language, stdin, timeLimitMs }) => {
  const runtime = SUPPORTED_LANGUAGES[language];
  const baseUrl = process.env.JUDGE_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("JUDGE_BASE_URL must point to a self-hosted Piston API.");
  }

  // Inject an in-program timer so we report real execution time, not wall clock.
  code = injectTimingLogic(code, language);

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), COMPILE_TIMEOUT_MS + timeLimitMs + 2_000);

  try {
    const headers: Record<string, string> = { "content-type": "application/json" };

    if (process.env.JUDGE_API_KEY) {
      headers.authorization = `Bearer ${process.env.JUDGE_API_KEY}`;
    }

    // begin execution engine timer
    const pistonStartTime = Date.now();

    // pass user input to piston for execution and output
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/execute`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        language: runtime.pistonLanguage,
        version: process.env[`PISTON_${language.toUpperCase()}_VERSION`] ?? runtime.version,
        files: [{ content: code }],
        stdin,
        compile_timeout: COMPILE_TIMEOUT_MS,
        run_timeout: timeLimitMs,
      }),
    });

    if (!response.ok) {
      const details = (await response.text()).replace(/\s+/g, " ").trim().slice(0, 200);
      throw new Error(
        `Judge service returned HTTP ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const data = (await response.json()) as PistonResponse;
    const compile = data.compile;
    const run = data.run;
    const compileOutput = `${compile?.stdout ?? ""}${compile?.stderr ?? ""}${compile?.output ?? ""}`;

    const compileTimedOut = isPistonTimeout(compile);

    // Handle compilation fails NOT through time-outs
    if (compile && !compileTimedOut && compile.code !== 0) {
      return {
        stdout: "",
        stderr: compileOutput.slice(0, OUTPUT_LIMIT),
        exitCode: compile.code ?? null,
        signal: compile.signal ?? null,
        runtimeMs: Date.now() - pistonStartTime,
        compileError: compileOutput.slice(0, OUTPUT_LIMIT) || "Compilation failed.",
      } satisfies ExecutionResult;
    }

    const runTimedOut = isPistonTimeout(run);
    const runtimeWithCompilation = Date.now() - pistonStartTime;

    if (runTimedOut) {
      return {
        stdout: (run?.stdout ?? "").slice(0, OUTPUT_LIMIT),
        stderr: "Time limit exceeded.",
        exitCode: typeof run?.code === "number" ? run.code : null,
        signal: run?.signal ?? null,
        runtimeMs: timeLimitMs,
        timedOut: true,
      } satisfies ExecutionResult;
    }

    // Strip the injected timer marker and recover the real execution time.
    const { runtimeMs, finalStdout } = cleanStdout(run?.stdout ?? "", runtimeWithCompilation);

    return {
      stdout: finalStdout.slice(0, OUTPUT_LIMIT),
      stderr: (run?.stderr ?? run?.output ?? "").slice(0, OUTPUT_LIMIT),
      exitCode: typeof run?.code === "number" ? run.code : null,
      signal: run?.signal ?? null,
      runtimeMs,
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
