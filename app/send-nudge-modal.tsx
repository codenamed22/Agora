import { sendNudge } from "./nudges/actions";

const errors: Record<string, string> = {
  invalid: "Check the nudge title and optional link.",
  self: "You cannot nudge yourself.",
  recipient: "That member is not available for nudges.",
};

export default function SendNudgeModal({
  recipientId,
  recipientName,
  error,
  returnTo,
}: Readonly<{
  recipientId: string;
  recipientName: string;
  error?: string;
  returnTo: string;
}>) {
  return (
    <div className="modal-backdrop" id="send-nudge">
      <section className="badge-create-modal" aria-label={`Send a nudge to ${recipientName}`}>
        <a className="modal-close" href={returnTo} aria-label="Close">
          x
        </a>
        <h2>Send a nudge</h2>
        <p>Challenge {recipientName} to solve a problem, read an article, or complete a task.</p>
        {error ? <div className="form-message error">{errors[error] ?? errors.invalid}</div> : null}
        <form action={sendNudge} className="stacked-form">
          <input type="hidden" name="returnTo" value={returnTo} />
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
            <button className="button" type="submit">
              Send nudge
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
