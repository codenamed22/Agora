"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

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

export function buildFeedbackMailto({
  details,
  email,
  pageUrl,
  timestamp,
}: {
  details: string;
  email: string;
  pageUrl: string;
  timestamp: string;
}) {
  const body = buildFeedbackBody({ details, pageUrl, timestamp });

  return `mailto:${email}?subject=${encodeURIComponent("ShardUp feedback")}&body=${encodeURIComponent(body)}`;
}

export default function FeedbackWidget({ email }: Readonly<{ email: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [message, setMessage] = useState("");

  const timestamp = new Date().toISOString();

  async function captureScreenshot() {
    setMessage("");

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMessage("Screenshot capture is not supported in this browser.");
      return;
    }

    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch {
      setMessage("Screenshot capture was cancelled.");
      return;
    }

    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    stream.getTracks().forEach((track) => track.stop());

    canvas.toBlob((blob) => {
      if (!blob) {
        setMessage("Could not capture screenshot.");
        return;
      }

      if (screenshotUrl) {
        URL.revokeObjectURL(screenshotUrl);
      }

      setScreenshotBlob(blob);
      setScreenshotUrl(URL.createObjectURL(blob));
      setMessage("Screenshot captured. Download it and attach it if your email app needs it.");
    }, "image/png");
  }

  async function sendFeedback() {
    const pageUrl = window.location.href;
    const body = buildFeedbackBody({ details, pageUrl, timestamp });
    const mailto = buildFeedbackMailto({ details, email, pageUrl, timestamp });

    if (screenshotBlob && navigator.share && navigator.canShare) {
      const file = new File([screenshotBlob], `shardup-feedback-${Date.now()}.png`, {
        type: "image/png",
      });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "ShardUp feedback", text: body, files: [file] });
        return;
      }
    }

    window.location.href = mailto;
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
              We will include this page and timestamp: <span>{timestamp}</span>
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

            {screenshotUrl ? (
              <div className="feedback-screenshot">
                <img src={screenshotUrl} alt="Captured screenshot preview" />
                <a className="text-link" href={screenshotUrl} download="shardup-feedback.png">
                  Download screenshot
                </a>
              </div>
            ) : null}

            {message ? <p className="feedback-message">{message}</p> : null}

            <div className="feedback-actions">
              <button className="secondary-button" type="button" onClick={captureScreenshot}>
                Capture screenshot
              </button>
              <button className="button" type="button" onClick={sendFeedback}>
                Send feedback
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
