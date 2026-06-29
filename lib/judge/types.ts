import type { SubmissionVerdict } from "@prisma/client";
import type { SupportedLanguage } from "./languages";

export type JudgeTestCase = {
  input: string;
  expectedOutput: string;
  isSample?: boolean;
};

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  runtimeMs: number | null;
  compileError?: string;
  timedOut?: boolean;
};

export type CodeExecutor = (params: {
  language: SupportedLanguage;
  code: string;
  stdin: string;
  timeLimitMs: number;
}) => Promise<ExecutionResult>;

export type JudgeResult = {
  verdict: SubmissionVerdict;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  failureMessage?: string | null;
};
