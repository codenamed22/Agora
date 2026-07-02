"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { sendNudge, type SendNudgeState } from "./nudges/actions";

const errors: Record<string, string> = {
  invalid: "Check the nudge title and optional link.",
  self: "You cannot nudge yourself.",
  recipient: "That member is not available for nudges.",
};

const initialState: SendNudgeState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send nudge"}
    </button>
  );
}

export default function SendNudgeModal({
  recipientId,
  recipientName,
  returnTo,
}: Readonly<{
  recipientId: string;
  recipientName: string;
  returnTo: string;
}>) {
  const [state, formAction] = useFormState(sendNudge, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.ok) {
      return;
    }
    // A server-action redirect can't update the URL hash, so close the :target
    // modal on the client and refresh to show the newly sent nudge.
    formRef.current?.reset();
    window.location.hash = "nudges";
    router.refresh();
  }, [state, router]);

  return (
    <div className="modal-backdrop" id="send-nudge">
      <section className="badge-create-modal" aria-label={`Send a nudge to ${recipientName}`}>
        <a className="modal-close" href={returnTo} aria-label="Close">
          x
        </a>
        <h2>Send a nudge</h2>
        <p>Challenge {recipientName} to solve a problem, read an article, or complete a task.</p>
        {state.error ? (
          <div className="form-message error">{errors[state.error] ?? errors.invalid}</div>
        ) : null}
        <form action={formAction} className="stacked-form" ref={formRef}>
          <input type="hidden" name="recipientId" value={recipientId} />

          <label htmlFor="nudge-title">Challenge*</label>
          <input id="nudge-title" name="title" placeholder="Solve this LeetCode problem" required />

          <label htmlFor="nudge-message">Message</label>
          <textarea
            id="nudge-message"
            name="message"
            placeholder="Add context or encouragement"
            rows={4}
          />

          <label htmlFor="nudge-link">Link</label>
          <input
            id="nudge-link"
            name="link"
            placeholder="https://leetcode.com/problems/..."
            type="url"
          />

          <div className="modal-actions">
            <a className="text-link" href={returnTo}>
              Cancel
            </a>
            <SubmitButton />
          </div>
        </form>
      </section>
    </div>
  );
}
