"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { submitContestSolution } from "../../actions";

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
  failureMessage: string | null;
};

const verdictLabels: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong answer",
  TLE: "Time limit exceeded",
  RUNTIME_ERROR: "Runtime error",
  COMPILE_ERROR: "Compile error",
};

const verdictTone: Record<string, "success" | "warning" | "error"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  WRONG_ANSWER: "error",
  TLE: "error",
  RUNTIME_ERROR: "error",
  COMPILE_ERROR: "error",
};

const starterCode: Record<string, string> = {
  python: "# Write your solution here\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
};

function SubmissionMeta({ submission }: Readonly<{ submission: Submission }>) {
  return (
    <>
      <strong className="verdict-label">
        {verdictLabels[submission.verdict] ?? submission.verdict}
      </strong>
      <span>{submission.language}</span>
      <span>
        {submission.passedCount}/{submission.totalCount} tests
      </span>
      <span>{submission.runtimeMs ?? 0}ms</span>
    </>
  );
}

function languageExtensions(language: string) {
  return language === "cpp" ? [cpp()] : [python()];
}

function blockEvent(event: Event) {
  event.preventDefault();
  return true;
}

const blockClipboard = EditorView.domEventHandlers({
  paste: blockEvent,
  copy: blockEvent,
  cut: blockEvent,
  drop: blockEvent,
  dragstart: blockEvent,
  contextmenu: blockEvent,
});

const draftKey = (contestSlug: string, label: string, language: string) =>
  `shardup:contest:${contestSlug}:${label}:${language}`;

export function ContestSubmissionPanel({
  contestSlug,
  problemLabel,
  languageOptions,
  submissions,
}: Readonly<{
  contestSlug: string;
  problemLabel: string;
  languageOptions: LanguageOption[];
  submissions: Submission[];
}>) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(starterCode.python);
  const [error, setError] = useState<string | null>(null);
  const [runningLanguage, setRunningLanguage] = useState("python");

  useEffect(() => {
    const saved = localStorage.getItem(draftKey(contestSlug, problemLabel, language));
    setCode(saved ?? starterCode[language] ?? "");
  }, [contestSlug, problemLabel, language]);

  function handleCodeChange(value: string) {
    setCode(value);
    localStorage.setItem(draftKey(contestSlug, problemLabel, language), value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submittedCode = code;

    if (!submittedCode.trim()) {
      setError("Add a solution before submitting.");
      return;
    }

    formData.set("code", submittedCode);
    setError(null);
    setRunningLanguage(language);
    setIsRunning(true);

    try {
      await submitContestSolution(formData);
      router.refresh();
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <>
      <form className="stacked-form" onSubmit={handleSubmit}>
        <input type="hidden" name="contestSlug" value={contestSlug} />
        <input type="hidden" name="problemLabel" value={problemLabel} />
        <label>
          Language
          <select
            name="language"
            value={language}
            disabled={isRunning}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="code-editor-shell">
          <div className="code-editor-toolbar">
            <span>Code</span>
            <span>{languageOptions.find((option) => option.value === language)?.label}</span>
          </div>
          <CodeMirror
            aria-label="Code editor"
            basicSetup={{
              bracketMatching: true,
              closeBrackets: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              lineNumbers: true,
            }}
            editable={!isRunning}
            extensions={[...languageExtensions(language), blockClipboard]}
            height="var(--problem-editor-height, 360px)"
            onChange={handleCodeChange}
            theme={oneDark}
            value={code}
          />
        </div>
        {error ? <div className="form-message error">{error}</div> : null}
        <button className="button" type="submit" disabled={isRunning}>
          {isRunning ? "Running tests..." : "Submit solution"}
        </button>
      </form>

      <div className="problem-section">
        <h2>Your recent submissions</h2>
        {isRunning || submissions.length > 0 ? (
          <div className="submission-list" aria-live="polite">
            {isRunning ? (
              <article className="submission-entry running-submission verdict-warning">
                <div className="submission-row">
                  <strong className="verdict-label">Pending</strong>
                  <span>{runningLanguage}</span>
                  <span>Running tests...</span>
                  <span className="submission-spinner" aria-hidden="true" />
                </div>
              </article>
            ) : null}
            {submissions.map((submission) => (
              <article
                className={`submission-entry verdict-${verdictTone[submission.verdict] ?? "error"}`}
                key={submission.id}
              >
                {submission.failureMessage ? (
                  <details className="submission-details">
                    <summary className="submission-row">
                      <SubmissionMeta submission={submission} />
                    </summary>
                    <pre className="submission-failure-message">{submission.failureMessage}</pre>
                  </details>
                ) : (
                  <div className="submission-row">
                    <SubmissionMeta submission={submission} />
                  </div>
                )}
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
