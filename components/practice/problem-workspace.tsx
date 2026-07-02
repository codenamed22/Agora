"use client";

import { useRouter } from "next/navigation";
import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

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

type SampleTest = {
  id: string;
  input: string;
  expectedOutput: string;
};

type EphemeralRunResult = {
  verdict: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  failureMessage?: string | null;
};

type WorkspaceTab = "description" | "submissions";

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

// Anti-cheat: block copy/cut/paste, drag-drop, and the right-click menu in the editor.
// Client-side deterrent only — it stops casual copy-pasting, not determined bypassing.
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

const draftKey = (scope: string, language: string) => `shardup:draft:${scope}:${language}`;
const splitKey = "shardup:practice-split";

// Keep the resizable split within sane bounds so neither pane collapses.
const MIN_SPLIT = 0.25;
const MAX_SPLIT = 0.75;

function clampSplit(value: number) {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value));
}

function SubmissionGate({ userStatus }: Readonly<{ userStatus?: string }>) {
  if (!userStatus) {
    return (
      <a className="button" href="/join">
        Sign in to submit
      </a>
    );
  }

  return (
    <a className="button" href="/apply">
      Finish application to submit
    </a>
  );
}

export function ProblemWorkspace({
  statement,
  constraints,
  samples,
  languageOptions,
  submissions,
  submitAction,
  hiddenFields,
  draftScope,
  canSubmit,
  userStatus,
  initialCodeByLanguage,
  rateLimited = false,
  rateLimitMessage = "Daily submission limit reached. Try again tomorrow.",
}: Readonly<{
  statement: string;
  constraints: string | null;
  samples: SampleTest[];
  languageOptions: LanguageOption[];
  submissions: Submission[];
  // Returning a run result (instead of void) marks an ephemeral run: it is shown
  // in the submissions list but never persisted. Void triggers a server refresh.
  submitAction: (formData: FormData) => Promise<void | EphemeralRunResult>;
  hiddenFields: Record<string, string>;
  draftScope: string;
  canSubmit: boolean;
  userStatus?: string;
  initialCodeByLanguage?: Record<string, string>;
  rateLimited?: boolean;
  rateLimitMessage?: string;
}>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("description");
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(starterCode.python);
  const [error, setError] = useState<string | null>(null);
  const [runningLanguage, setRunningLanguage] = useState("python");
  const [ephemeralSubmissions, setEphemeralSubmissions] = useState<Submission[]>([]);
  const [split, setSplit] = useState(0.5);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Restore the saved draft for this problem + language (localStorage survives refresh).
  // With no saved draft, fall back to any provided starter (e.g. the reference
  // solution in admin preview), then the generic language starter.
  useEffect(() => {
    const saved = localStorage.getItem(draftKey(draftScope, language));
    const fallback = initialCodeByLanguage?.[language] ?? starterCode[language] ?? "";
    setCode(saved ?? fallback);
    // initialCodeByLanguage is a stable server prop; excluded to avoid clobbering edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftScope, language]);

  // Restore the saved pane split (client-only to avoid a hydration mismatch).
  useEffect(() => {
    const saved = Number(localStorage.getItem(splitKey));
    if (Number.isFinite(saved) && saved > 0) {
      setSplit(clampSplit(saved));
    }
  }, []);

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      if (!draggingRef.current || !workspaceRef.current) {
        return;
      }
      const rect = workspaceRef.current.getBoundingClientRect();
      if (rect.width === 0) {
        return;
      }
      setSplit(clampSplit((event.clientX - rect.left) / rect.width));
    }

    function handleUp() {
      if (!draggingRef.current) {
        return;
      }
      draggingRef.current = false;
      document.body.classList.remove("is-resizing-panes");
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(splitKey, String(split));
  }, [split]);

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    draggingRef.current = true;
    document.body.classList.add("is-resizing-panes");
  }

  function handleCodeChange(value: string) {
    setCode(value);
    localStorage.setItem(draftKey(draftScope, language), value);
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
    // Jump to the submissions tab so the verdict is visible while it runs.
    setActiveTab("submissions");

    try {
      const result = await submitAction(formData);
      if (result) {
        // Ephemeral run (admin preview): show the verdict without persisting.
        setEphemeralSubmissions((previous) => [
          {
            id: `preview-${Date.now()}`,
            language,
            verdict: result.verdict,
            passedCount: result.passedCount,
            totalCount: result.totalCount,
            runtimeMs: result.runtimeMs,
            failureMessage: result.failureMessage ?? null,
          },
          ...previous,
        ]);
      } else {
        router.refresh();
      }
    } finally {
      setIsRunning(false);
    }
  }

  const activeLanguageLabel = languageOptions.find((option) => option.value === language)?.label;

  return (
    <div
      className="practice-workspace"
      ref={workspaceRef}
      style={{ "--left": split, "--right": 1 - split } as React.CSSProperties}
    >
      <section className="practice-prompt-pane problem-readonly" aria-label="Problem workspace">
        <div className="practice-tabs" role="tablist" aria-label="Problem panels">
          <button
            type="button"
            role="tab"
            id="tab-description"
            aria-selected={activeTab === "description"}
            aria-controls="panel-description"
            className={`practice-tab${activeTab === "description" ? " is-active" : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Description
          </button>
          <button
            type="button"
            role="tab"
            id="tab-submissions"
            aria-selected={activeTab === "submissions"}
            aria-controls="panel-submissions"
            className={`practice-tab${activeTab === "submissions" ? " is-active" : ""}`}
            onClick={() => setActiveTab("submissions")}
          >
            Submissions
          </button>
        </div>

        <div
          role="tabpanel"
          id="panel-description"
          aria-labelledby="tab-description"
          hidden={activeTab !== "description"}
        >
          <div className="problem-statement">{statement}</div>
          {constraints ? (
            <div className="problem-section">
              <h2>Constraints</h2>
              <pre>{constraints}</pre>
            </div>
          ) : null}

          <div className="problem-section">
            <h2>Sample tests</h2>
            <div className="sample-list">
              {samples.map((testCase, index) => (
                <article className="sample-card" key={testCase.id}>
                  <h3>Sample {index + 1}</h3>
                  <label>
                    Input
                    <pre>{testCase.input}</pre>
                  </label>
                  <label>
                    Output
                    <pre>{testCase.expectedOutput}</pre>
                  </label>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-submissions"
          aria-labelledby="tab-submissions"
          hidden={activeTab !== "submissions"}
        >
          {isRunning || ephemeralSubmissions.length > 0 || submissions.length > 0 ? (
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
              {[...ephemeralSubmissions, ...submissions].map((submission) => (
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
      </section>

      <div
        className="practice-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        onPointerDown={startResize}
      />

      <section className="practice-submit-pane" aria-label="Solution editor">
        {rateLimited ? <div className="form-message error">{rateLimitMessage}</div> : null}
        {canSubmit ? (
          <form className="stacked-form editor-form" onSubmit={handleSubmit}>
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input type="hidden" name={name} value={value} key={name} />
            ))}
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
                <span>{activeLanguageLabel}</span>
              </div>
              <div className="code-editor-body">
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
                  height="100%"
                  onChange={handleCodeChange}
                  theme={oneDark}
                  value={code}
                />
              </div>
            </div>
            {error ? <div className="form-message error">{error}</div> : null}
            <button className="button" type="submit" disabled={isRunning}>
              {isRunning ? "Running tests..." : "Submit solution"}
            </button>
          </form>
        ) : (
          <SubmissionGate userStatus={userStatus} />
        )}
      </section>
    </div>
  );
}
