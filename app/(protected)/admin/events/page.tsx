/* eslint-disable @next/next/no-img-element */

import { formatEventListDate } from "../../../../lib/events";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";
import CreateEventModal from "../../../create-event-modal";
import { deleteEvent } from "./actions";

export default async function AdminEventsPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  await requireAdmin();
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { rsvps: true } } },
  });

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Events</h1>
        <p>Create, edit, publish, unpublish, and delete ShardUp events.</p>
        {searchParams?.error ? (
          <div className="form-message error">Check the event fields.</div>
        ) : null}

        <a className="button" href="#create-event">
          Create event
        </a>
        <CreateEventModal error={searchParams?.error} returnTo="/admin/events" />

        <div className="member-badge-admin-list">
          {events.map((event) => (
            <article className="member-badge-admin-row" key={event.id}>
              {event.imageUrl ? (
                <img className="badge-admin-thumb" src={event.imageUrl} alt="" />
              ) : (
                <span className="badge-admin-thumb badge-image-fallback">Event</span>
              )}
              <div>
                <strong>{event.title}</strong>
                <small>
                  {formatEventListDate(event.startsAt, event.endsAt)} · {event.location} ·{" "}
                  {event._count.rsvps} going · {event.published ? "Published" : "Unpublished"}
                </small>
              </div>
              <a className="secondary-button" href={`/admin/events/${event.id}`}>
                Manage
              </a>
              <form action={deleteEvent}>
                <input type="hidden" name="eventId" value={event.id} />
                <button className="secondary-button" type="submit">
                  Delete
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
