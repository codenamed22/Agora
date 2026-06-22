"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { submitSolution } from "./actions";

type LanguageOption = {
  value: string;
  label: string;
};

type Submission = {
  id: string;
  language: string;
  verdict: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
};

const verdictLabels: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong answer",
  TLE: "Time limit exceeded",
  RUNTIME_ERROR: "Runtime error",
  COMPILE_ERROR: "Compile error",
};

export function SubmissionPanel({
  languageOptions,
  problemSlug,
  submissions,
}: Readonly<{
  languageOptions: LanguageOption[];
  problemSlug: string;
  submissions: Submission[];
}>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningLanguage, setRunningLanguage] = useState("python");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    setRunningLanguage(String(formData.get("language") ?? "python"));
    setIsRunning(true);

    try {
      await submitSolution(formData);
      router.refresh();
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <>
      <form className="stacked-form" onSubmit={handleSubmit} ref={formRef}>
        <input type="hidden" name="problemSlug" value={problemSlug} />
        <label>
          Language
          <select name="language" defaultValue="python" disabled={isRunning}>
            {languageOptions.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Code
          <textarea name="code" rows={14} required spellCheck={false} disabled={isRunning} />
        </label>
        <button className="button" type="submit" disabled={isRunning}>
          {isRunning ? "Running tests..." : "Submit solution"}
        </button>
      </form>

      <div className="problem-section">
        <h2>Your recent submissions</h2>
        {isRunning || submissions.length > 0 ? (
          <div className="submission-list" aria-live="polite">
            {isRunning ? (
              <article className="submission-row running-submission">
                <strong>Pending</strong>
                <span>{runningLanguage}</span>
                <span>Running tests...</span>
                <span className="submission-spinner" aria-hidden="true" />
              </article>
            ) : null}
            {submissions.map((submission) => (
              <article className="submission-row" key={submission.id}>
                <strong>{verdictLabels[submission.verdict] ?? submission.verdict}</strong>
                <span>{submission.language}</span>
                <span>
                  {submission.passedCount}/{submission.totalCount} tests
                </span>
                <span>{submission.runtimeMs ?? 0}ms</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="form-message">No submissions yet.</div>
        )}
      </div>
    </>
  );
}
