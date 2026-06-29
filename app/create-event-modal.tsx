import { createEvent } from "./(protected)/admin/events/actions";
import CompressingImageInput from "./compressing-image-input";

const errors: Record<string, string> = {
  invalid: "Check the event fields and times.",
  image: "Upload a JPG, PNG, WebP, or SVG event image under 2MB.",
  storage: "Event image storage is not configured yet. Add BLOB_READ_WRITE_TOKEN.",
};

export default function CreateEventModal({
  error,
  returnTo,
}: Readonly<{ error?: string; returnTo: string }>) {
  return (
    <div className="modal-backdrop" id="create-event">
      <section className="badge-create-modal" aria-label="Create a new event">
        <a className="modal-close" href={returnTo} aria-label="Close">
          x
        </a>
        <h2>Create a new event</h2>
        {error ? <div className="form-message error">{errors[error] ?? errors.invalid}</div> : null}
        <form action={createEvent} className="stacked-form">
          <input type="hidden" name="returnTo" value={returnTo} />

          <label htmlFor="event-title">Title*</label>
          <input id="event-title" name="title" placeholder="Event title..." required />

          <label htmlFor="event-description">Description*</label>
          <textarea
            id="event-description"
            name="description"
            placeholder="What should members expect?"
            rows={4}
            required
          />

          <label htmlFor="event-location">Location*</label>
          <input id="event-location" name="location" placeholder="Online / Room 101" required />

          <label htmlFor="event-starts-at">Starts at* (IST)</label>
          <input id="event-starts-at" name="startsAt" type="datetime-local" required />

          <label htmlFor="event-ends-at">Ends at (IST)</label>
          <input id="event-ends-at" name="endsAt" type="datetime-local" />

          <label className="checkbox-row" htmlFor="event-published">
            <input id="event-published" name="published" type="checkbox" defaultChecked />
            Publish immediately
          </label>

          <label htmlFor="event-image">Event image</label>
          <div className="badge-upload-row">
            <span className="badge-upload-icon">▣</span>
            <div>
              <strong>Event image</strong>
              <small>Optional · maximum 2MB</small>
            </div>
            <CompressingImageInput id="event-image" name="image" />
          </div>

          <div className="modal-actions">
            <a className="text-link" href={returnTo}>
              Cancel
            </a>
            <button className="button" type="submit">
              Create Event
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
