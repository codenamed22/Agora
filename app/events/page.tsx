/* eslint-disable @next/next/no-img-element */

import { Role, UserStatus } from "@/prisma-client";
import { auth } from "../../auth";
import { formatEventListDate } from "../../lib/events";
import { prisma } from "../../lib/prisma";
import CreateEventModal from "../create-event-modal";
import RsvpControl from "./rsvp-control";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE;
  const events = await prisma.event.findMany({
    where: {
      published: true,
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      location: true,
      startsAt: true,
      endsAt: true,
      rsvps: {
        where: { userId: userId ?? "" },
        select: { id: true },
      },
      _count: { select: { rsvps: true } },
    },
  });

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Events</p>
        <h1>Upcoming ShardUp sessions.</h1>
        <p>
          Join community sessions, reading jams, and builder circles. RSVP is open to active ShardUp
          members.
        </p>
        {isAdmin ? (
          <>
            <a className="button" href="#create-event">
              Add event
            </a>
            <CreateEventModal returnTo="/events" />
          </>
        ) : null}

        <div className="event-list">
          {events.length > 0 ? (
            events.map((event) => {
              const isGoing = Boolean(event.rsvps && event.rsvps.length > 0);

              return (
                <article
                  className={event.imageUrl ? "event-card has-event-image" : "event-card"}
                  key={event.id}
                >
                  {event.imageUrl ? (
                    <a className="event-image-link" href={`/events/${event.id}`}>
                      <img className="event-image" src={event.imageUrl} alt="" />
                    </a>
                  ) : null}
                  <div>
                    <h2>
                      <a href={`/events/${event.id}`}>{event.title}</a>
                    </h2>
                    <div className="event-summary-meta">
                      <span>{formatEventListDate(event.startsAt, event.endsAt)}</span>
                      <span>{event.location}</span>
                      <span>{event._count.rsvps} going</span>
                    </div>
                    <p>{event.description}</p>
                  </div>
                  <div className="event-actions">
                    <RsvpControl
                      eventId={event.id}
                      userStatus={session?.user?.status}
                      isGoing={isGoing}
                    />
                    <a className="text-link" href={`/events/${event.id}`}>
                      Details
                    </a>
                    {isAdmin ? (
                      <a className="text-link" href={`/admin/events/${event.id}`}>
                        Edit
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="form-message">No upcoming events are published yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
