/* eslint-disable @next/next/no-img-element */

import { Role, UserStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import { formatEventDetailDate } from "../../../lib/events";
import { prisma } from "../../../lib/prisma";
import RsvpControl from "../rsvp-control";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE;
  const event = await prisma.event.findFirst({
    where: {
      id: params.id,
      published: true,
      startsAt: { gte: new Date() },
    },
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

  if (!event) {
    notFound();
  }

  const isGoing = Boolean(event.rsvps && event.rsvps.length > 0);

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">Event details</p>
        <h1>{event.title}</h1>
        {event.imageUrl ? <img className="event-hero-image" src={event.imageUrl} alt="" /> : null}
        <div className="event-detail-meta">
          <p>
            <span>When</span>
            {formatEventDetailDate(event.startsAt, event.endsAt)}
          </p>
          <p>
            <span>Where</span>
            {event.location}
          </p>
          <p>
            <span>RSVPs</span>
            {event._count.rsvps} going
          </p>
        </div>
        <p>{event.description}</p>
        <div className="event-detail-actions">
          <RsvpControl eventId={event.id} userStatus={session?.user?.status} isGoing={isGoing} />
          <a className="text-link" href="/events">
            Back to events
          </a>
          {isAdmin ? (
            <a className="text-link" href={`/admin/events/${event.id}`}>
              Edit event
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
