"use client";

import { useState } from "react";

const FEEDBACK_ISSUE_URL = "https://github.com/codenamed22/Agora/issues/new";

export function buildFeedbackBody({
  details,
  pageUrl,
  timestamp,
}: {
  details: string;
  pageUrl: string;
  timestamp: string;
}) {
  return `Timestamp: ${timestamp}\nPage: ${pageUrl}\n\nProblem details:\n${details.trim() || "(not provided)"}`;
}

export function buildFeedbackIssueUrl({
  details,
  pageUrl,
  timestamp,
}: {
  details: string;
  pageUrl: string;
  timestamp: string;
}) {
  const title = details.trim().split("\n")[0]?.slice(0, 80) || "ShardUp feedback";
  const body = buildFeedbackBody({ details, pageUrl, timestamp });
  const params = new URLSearchParams({
    title: `Feedback: ${title}`,
    body,
    labels: "feedback",
  });

  return `${FEEDBACK_ISSUE_URL}?${params.toString()}`;
}

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState("");

  const timestamp = new Date().toISOString();

  function sendFeedback() {
    const pageUrl = window.location.href;
    const issueUrl = buildFeedbackIssueUrl({
      details,
      pageUrl,
      timestamp,
    });

    window.location.href = issueUrl;
  }

  return (
    <>
      <button
        aria-label="Send feedback"
        className="feedback-button"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        :)
      </button>

      {isOpen ? (
        <div className="feedback-backdrop" role="presentation">
          <section className="feedback-panel" aria-label="Send feedback">
            <div className="feedback-panel-header">
              <div>
                <p className="section-label">Feedback</p>
                <h2>What went wrong?</h2>
              </div>
              <button className="feedback-close" type="button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>

            <p className="feedback-meta">
              We will open a GitHub issue with this page and timestamp: <span>{timestamp}</span>
            </p>

            <label className="feedback-label" htmlFor="feedback-details">
              Details
            </label>
            <textarea
              id="feedback-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Tell us what broke, what you expected, and anything you tried."
            />

            <div className="feedback-actions">
              <button className="button" type="button" onClick={sendFeedback}>
                Open GitHub issue
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
