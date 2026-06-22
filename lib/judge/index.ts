import { judgeSubmission } from "./core";
import { executeWithFakeJudge } from "./fake";
import { executeWithPiston } from "./piston";
import type { CodeExecutor } from "./types";

function getExecutor(): CodeExecutor {
  return process.env.JUDGE_PROVIDER === "fake" ? executeWithFakeJudge : executeWithPiston;
}

export async function runJudge(params: Omit<Parameters<typeof judgeSubmission>[0], "executor">) {
  return judgeSubmission({ ...params, executor: getExecutor() });
}

export { judgeSubmission, normalizeOutput } from "./core";
export { isSupportedLanguage, supportedLanguageOptions } from "./languages";
export type { SupportedLanguage } from "./languages";
