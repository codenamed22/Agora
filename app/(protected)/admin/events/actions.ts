"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eventSchema, parseEventDate } from "../../../../lib/events";
import { requireAdmin } from "../../../../lib/guards";
import { validateProfilePhoto } from "../../../../lib/members";
import { createNotification, eventPublishedMessage } from "../../../../lib/notifications";
import { prisma } from "../../../../lib/prisma";

function safeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .slice(0, 80) || "event"
  );
}

export type CreateEventState = { ok: boolean; error?: string };

function validateEventImage(file: File, imageErrorPath: string, storageErrorPath: string) {
  const imageError = validateProfilePhoto(file);

  if (imageError) {
    redirect(imageErrorPath);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    redirect(storageErrorPath);
  }
}

async function uploadEventImage(eventId: string, file: File) {
  validateEventImage(
    file,
    `/admin/events/${eventId}?error=image`,
    `/admin/events/${eventId}?error=storage`,
  );

  const blob = await put(`events/${eventId}-${Date.now()}-${safeFilename(file.name)}`, file, {
    access: "public",
  });

  return blob.url;
}

function parseEventForm(formData: FormData) {
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    endsAt: parsed.data.endsAt || null,
    startsAtDate: parseEventDate(parsed.data.startsAt),
    endsAtDate: parsed.data.endsAt ? parseEventDate(parsed.data.endsAt) : null,
  };
}

// Returns a result state (instead of redirecting) so the client modal can close
// itself on success — a server-action redirect can't update the URL hash that the
// :target modal relies on, which left the dialog stuck open.
export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const admin = await requireAdmin();
  const parsed = parseEventForm(formData);

  if (!parsed) {
    return { ok: false, error: "invalid" };
  }

  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    if (validateProfilePhoto(image)) {
      return { ok: false, error: "image" };
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return { ok: false, error: "storage" };
    }
  }

  const event = await prisma.event.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      location: parsed.location,
      startsAt: parsed.startsAtDate,
      endsAt: parsed.endsAtDate,
      published: parsed.published,
      createdById: admin.id,
    },
    select: { id: true },
  });

  if (image instanceof File && image.size > 0) {
    await prisma.event.update({
      where: { id: event.id },
      data: { imageUrl: await uploadEventImage(event.id, image) },
    });
  }

  // Only published events are visible to members, so announce those.
  if (parsed.published) {
    await createNotification({
      type: "EVENT_PUBLISHED",
      actorId: admin.id,
      message: eventPublishedMessage(parsed.title),
      link: `/events/${event.id}`,
    });
  }

  revalidatePath("/events");
  revalidatePath("/admin/events");
  return { ok: true };
}

export async function updateEvent(formData: FormData) {
  const admin = await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  const parsed = parseEventForm(formData);

  if (!eventId) {
    redirect("/admin/events");
  }

  if (!parsed) {
    redirect(`/admin/events/${eventId}?error=invalid`);
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    redirect("/admin/events");
  }

  let imageUrl = event.imageUrl;
  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadEventImage(event.id, image);

    if (event.imageUrl) {
      await del(event.imageUrl).catch(() => undefined);
    }
  }

  await prisma.event.update({
    where: { id: event.id },
    data: {
      title: parsed.title,
      description: parsed.description,
      location: parsed.location,
      startsAt: parsed.startsAtDate,
      endsAt: parsed.endsAtDate,
      published: parsed.published,
      imageUrl,
    },
  });

  // Announce when an event first becomes visible to members (draft -> published),
  // so editing an already-published event never re-notifies.
  if (!event.published && parsed.published) {
    await createNotification({
      type: "EVENT_PUBLISHED",
      actorId: admin.id,
      message: eventPublishedMessage(parsed.title),
      link: `/events/${event.id}`,
    });
  }

  revalidatePath("/events");
  revalidatePath(`/events/${event.id}`);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${event.id}`);
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    return;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    redirect("/admin/events");
  }

  await prisma.event.delete({ where: { id: eventId } });

  if (event.imageUrl) {
    await del(event.imageUrl).catch(() => undefined);
  }

  revalidatePath("/events");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}
