import { createContest } from "./(protected)/admin/contests/actions";

const errors: Record<string, string> = {
  invalid: "Check the contest title, slug, and schedule.",
  slug: "That contest slug is already in use.",
};

export default function CreateContestModal({
  error,
  returnTo,
}: Readonly<{ error?: string; returnTo: string }>) {
  return (
    <div className="modal-backdrop" id="create-contest">
      <section className="badge-create-modal" aria-label="Create a new contest" data-lenis-prevent>
        <a className="modal-close" href={returnTo} aria-label="Close">
          x
        </a>
        <h2>Create a new contest</h2>
        {error ? <div className="form-message error">{errors[error] ?? errors.invalid}</div> : null}
        <form action={createContest} className="stacked-form">
          <input type="hidden" name="returnTo" value={returnTo} />

          <label htmlFor="contest-title">Title*</label>
          <input id="contest-title" name="title" placeholder="ShardUp Contest #1" required />

          <label htmlFor="contest-slug">Slug*</label>
          <input id="contest-slug" name="slug" placeholder="shardup-contest-1" required />

          <label htmlFor="contest-description">Description*</label>
          <textarea
            id="contest-description"
            name="description"
            placeholder="What should members expect?"
            rows={4}
            required
          />

          <label htmlFor="contest-starts-at">Starts at* (IST)</label>
          <input id="contest-starts-at" name="startsAt" type="datetime-local" required />

          <label htmlFor="contest-ends-at">Ends at* (IST)</label>
          <input id="contest-ends-at" name="endsAt" type="datetime-local" required />

          <label htmlFor="contest-duration">Duration (minutes)*</label>
          <input
            id="contest-duration"
            name="durationMinutes"
            type="number"
            min={15}
            max={480}
            defaultValue={60}
            required
          />

          <div className="modal-actions">
            <a className="text-link" href={returnTo}>
              Cancel
            </a>
            <button className="button" type="submit">
              Create contest
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
