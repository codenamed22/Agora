"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
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

const verdictTone: Record<string, "success" | "warning" | "error"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  WRONG_ANSWER: "error",
  TLE: "error",
  RUNTIME_ERROR: "error",
  COMPILE_ERROR: "error",
};

const starterCode: Record<string, string> = {
  python: "a, b = map(int, input().split())\nprint(a + b)\n",
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    cin >> a >> b;\n    cout << a + b << "\\n";\n    return 0;\n}\n',
};

function languageExtensions(language: string) {
  return language === "cpp" ? [cpp()] : [python()];
}

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
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(starterCode.python);
  const [error, setError] = useState<string | null>(null);
  const [runningLanguage, setRunningLanguage] = useState("python");

  function handleLanguageChange(nextLanguage: string) {
    setLanguage(nextLanguage);

    if (!code.trim() || code === starterCode[language]) {
      setCode(starterCode[nextLanguage] ?? "");
    }
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
      await submitSolution(formData);
      router.refresh();
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <>
      <form className="stacked-form" onSubmit={handleSubmit}>
        <input type="hidden" name="problemSlug" value={problemSlug} />
        <label>
          Language
          <select
            name="language"
            value={language}
            disabled={isRunning}
            onChange={(event) => handleLanguageChange(event.target.value)}
          >
            {languageOptions.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
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
            extensions={languageExtensions(language)}
            height="360px"
            onChange={(value) => setCode(value)}
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
              <article className="submission-row running-submission verdict-warning">
                <strong className="verdict-label">Pending</strong>
                <span>{runningLanguage}</span>
                <span>Running tests...</span>
                <span className="submission-spinner" aria-hidden="true" />
              </article>
            ) : null}
            {submissions.map((submission) => (
              <article
                className={`submission-row verdict-${verdictTone[submission.verdict] ?? "error"}`}
                key={submission.id}
              >
                <strong className="verdict-label">
                  {verdictLabels[submission.verdict] ?? submission.verdict}
                </strong>
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
