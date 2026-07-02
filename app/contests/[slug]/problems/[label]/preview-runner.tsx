"use client";

import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { useState, useTransition } from "react";
import { runContestPreviewSolution } from "../../../../(protected)/admin/problems/actions";

type LanguageOption = { value: string; label: string };

type RunResult =
  | {
      ok: true;
      verdict: string;
      passedCount: number;
      totalCount: number;
      runtimeMs: number | null;
      failureMessage?: string | null;
    }
  | { ok: false; message: string };

const starterCode: Record<string, string> = {
  python: "# Write your solution here\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
};

function languageExtensions(language: string) {
  return language === "cpp" ? [cpp()] : [python()];
}

// Admin-only editor for the "Test contest" preview: write or tweak code and run
// it against every test case. Results are ephemeral (no submission is stored).
export default function ContestPreviewRunner({
  slug,
  languageOptions,
  initialCodeByLanguage,
}: Readonly<{
  slug: string;
  languageOptions: LanguageOption[];
  initialCodeByLanguage: Record<string, string>;
}>) {
  const initialLanguage = languageOptions[0]?.value ?? "python";
  const codeFor = (lang: string) => initialCodeByLanguage[lang] ?? starterCode[lang] ?? "";

  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(codeFor(initialLanguage));
  const [result, setResult] = useState<RunResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleLanguageChange(next: string) {
    setLanguage(next);
    setCode(codeFor(next));
    setResult(null);
  }

  function handleRun() {
    startTransition(async () => {
      setResult(await runContestPreviewSolution(slug, language, code));
    });
  }

  const activeLabel = languageOptions.find((option) => option.value === language)?.label;

  return (
    <div className="stacked-form editor-form">
      <label>
        Language
        <select
          value={language}
          disabled={pending}
          onChange={(event) => handleLanguageChange(event.target.value)}
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
          <span>{activeLabel}</span>
        </div>
        <div className="code-editor-body">
          <CodeMirror
            aria-label="Preview code editor"
            basicSetup={{
              bracketMatching: true,
              closeBrackets: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              lineNumbers: true,
            }}
            editable={!pending}
            extensions={languageExtensions(language)}
            height="360px"
            onChange={setCode}
            theme={oneDark}
            value={code}
          />
        </div>
      </div>
      <button className="button" type="button" disabled={pending} onClick={handleRun}>
        {pending ? "Running all tests..." : "Run against all tests"}
      </button>
      {result ? (
        result.ok ? (
          <div className={`form-message ${result.verdict === "ACCEPTED" ? "" : "error"}`}>
            {result.verdict} — {result.passedCount}/{result.totalCount} tests passed (
            {result.runtimeMs ?? 0}ms)
            {result.failureMessage ? (
              <pre className="submission-failure-message">{result.failureMessage}</pre>
            ) : null}
          </div>
        ) : (
          <div className="form-message error">{result.message}</div>
        )
      ) : null}
    </div>
  );
}
