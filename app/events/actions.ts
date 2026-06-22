"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveUser } from "../../lib/guards";
import { prisma } from "../../lib/prisma";

const rsvpSchema = z.object({
  eventId: z.string().trim().min(1),
});

async function getUpcomingEvent(eventId: string) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      published: true,
      startsAt: { gte: new Date() },
    },
    select: { id: true },
  });
}

export async function rsvpToEvent(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = rsvpSchema.safeParse({ eventId: formData.get("eventId") });

  if (!parsed.success) {
    redirect("/events");
  }

  const event = await getUpcomingEvent(parsed.data.eventId);

  if (!event) {
    redirect("/events");
  }

  await prisma.eventRsvp.upsert({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      eventId: event.id,
      userId: user.id,
    },
  });

  revalidatePath("/events");
  revalidatePath(`/events/${event.id}`);
}

export async function cancelEventRsvp(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = rsvpSchema.safeParse({ eventId: formData.get("eventId") });

  if (!parsed.success) {
    redirect("/events");
  }

  await prisma.eventRsvp.deleteMany({
    where: {
      eventId: parsed.data.eventId,
      userId: user.id,
    },
  });

  revalidatePath("/events");
  revalidatePath(`/events/${parsed.data.eventId}`);
}
