"use client";

import { useState, useTransition } from "react";
import { runReferenceSolution } from "../actions";

type RunResult =
  | { ok: true; verdict: string; passedCount: number; totalCount: number; runtimeMs: number | null }
  | { ok: false; message: string };

export default function RunSolution({
  language,
  slug,
}: Readonly<{ language: string; slug: string }>) {
  const [result, setResult] = useState<RunResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      setResult(await runReferenceSolution(slug, language));
    });
  }

  return (
    <div className="stacked-form">
      <button className="button" type="button" disabled={pending} onClick={handleRun}>
        {pending ? "Running..." : `Run ${language} reference against all tests`}
      </button>
      {result ? (
        result.ok ? (
          <div className={`form-message ${result.verdict === "ACCEPTED" ? "" : "error"}`}>
            {result.verdict} — {result.passedCount}/{result.totalCount} tests passed (
            {result.runtimeMs}ms)
          </div>
        ) : (
          <div className="form-message error">{result.message}</div>
        )
      ) : null}
    </div>
  );
}
