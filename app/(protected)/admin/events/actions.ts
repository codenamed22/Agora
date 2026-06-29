"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eventSchema, parseEventDate } from "../../../../lib/events";
import { requireAdmin } from "../../../../lib/guards";
import { validateProfilePhoto } from "../../../../lib/members";
import { prisma } from "../../../../lib/prisma";

function safeFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .slice(0, 80) || "event"
  );
}

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "/admin/events");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/admin/events";
}

function successPath(path: string) {
  return `${path}${path.includes("?") ? "&" : "?"}created=event`;
}

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

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const parsed = parseEventForm(formData);

  if (!parsed) {
    redirect(`${returnTo}?error=invalid#create-event`);
  }

  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    validateEventImage(
      image,
      `${returnTo}?error=image#create-event`,
      `${returnTo}?error=storage#create-event`,
    );
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

  revalidatePath("/events");
  revalidatePath("/admin/events");
  redirect(successPath(returnTo));
}

export async function updateEvent(formData: FormData) {
  await requireAdmin();
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
