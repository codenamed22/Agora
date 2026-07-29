"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createEvent, type CreateEventState } from "./(protected)/admin/events/actions";
import CompressingImageInput from "./compressing-image-input";

const errors: Record<string, string> = {
  invalid: "Check the event fields and times.",
  image: "Upload a JPG, PNG, WebP, or SVG event image under 2MB.",
  storage: "Event image storage is not configured yet. Add BLOB_READ_WRITE_TOKEN.",
};

const initialState: CreateEventState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Event"}
    </button>
  );
}

export default function CreateEventModal({ returnTo }: Readonly<{ returnTo: string }>) {
  const [state, formAction] = useFormState(createEvent, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.ok) {
      return;
    }
    // A server-action redirect can't update the URL hash, so close the :target
    // modal on the client and refresh to show the newly created event.
    formRef.current?.reset();
    window.location.hash = "event-created";
    router.refresh();
  }, [state, router]);

  return (
    <div className="modal-backdrop" id="create-event">
      <section className="badge-create-modal" aria-label="Create a new event" data-lenis-prevent>
        <a className="modal-close" href={returnTo} aria-label="Close">
          x
        </a>
        <h2>Create a new event</h2>
        {state.error ? (
          <div className="form-message error">{errors[state.error] ?? errors.invalid}</div>
        ) : null}
        <form action={formAction} className="stacked-form" ref={formRef}>
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
            <SubmitButton />
          </div>
        </form>
      </section>
    </div>
  );
}
