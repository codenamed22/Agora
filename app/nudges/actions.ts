"use server";

import { NudgeStatus, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActiveUser } from "../../lib/guards";
import { nudgeSchema } from "../../lib/nudges";
import { prisma } from "../../lib/prisma";

const nudgeIdSchema = z.object({
  nudgeId: z.string().trim().min(1),
});

function stripFragment(url: string) {
  const hashIndex = url.indexOf("#");
  return hashIndex === -1 ? url : url.slice(0, hashIndex);
}

function redirectWithError(returnTo: string, error: string): never {
  const base = stripFragment(returnTo);
  const separator = base.includes("?") ? "&" : "?";
  // Keep the modal open (via #send-nudge) so the error is visible inside it.
  redirect(`${base}${separator}error=${error}#send-nudge`);
}

async function getActiveRecipient(recipientId: string) {
  return prisma.user.findFirst({
    where: { id: recipientId, status: UserStatus.ACTIVE },
    select: { id: true },
  });
}

function profileNudgesPath(userId: string) {
  return `/members/${userId}#nudges`;
}

function revalidateNudgeProfiles(senderId: string, recipientId: string) {
  revalidatePath(`/members/${senderId}`);
  revalidatePath(`/members/${recipientId}`);
  revalidatePath("/nudges");
}

export async function sendNudge(formData: FormData) {
  const user = await requireActiveUser();
  const returnTo = String(formData.get("returnTo") ?? profileNudgesPath(user.id));

  const parsed = nudgeSchema.safeParse({
    recipientId: formData.get("recipientId"),
    title: formData.get("title"),
    message: formData.get("message"),
    link: formData.get("link"),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "invalid");
  }

  const data = parsed.data;

  if (data.recipientId === user.id) {
    redirectWithError(returnTo, "self");
  }

  const recipient = await getActiveRecipient(data.recipientId);

  if (!recipient) {
    redirectWithError(returnTo, "recipient");
  }

  await prisma.nudge.create({
    data: {
      senderId: user.id,
      recipientId: recipient.id,
      title: data.title,
      message: data.message,
      link: data.link,
      status: NudgeStatus.PENDING,
    },
  });

  revalidateNudgeProfiles(user.id, recipient.id);
  // Redirect to a different fragment so the #send-nudge modal closes on success.
  redirect(`${stripFragment(returnTo)}#nudges`);
}

export async function acceptNudge(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = nudgeIdSchema.safeParse({ nudgeId: formData.get("nudgeId") });

  if (!parsed.success) {
    redirect(profileNudgesPath(user.id));
  }

  const nudge = await prisma.nudge.findFirst({
    where: {
      id: parsed.data.nudgeId,
      recipientId: user.id,
      status: NudgeStatus.PENDING,
    },
    select: { id: true, senderId: true, recipientId: true },
  });

  if (!nudge) {
    redirect(profileNudgesPath(user.id));
  }

  await prisma.nudge.update({
    where: { id: nudge.id },
    data: {
      status: NudgeStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
  });

  revalidateNudgeProfiles(nudge.senderId, nudge.recipientId);
}

export async function declineNudge(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = nudgeIdSchema.safeParse({ nudgeId: formData.get("nudgeId") });

  if (!parsed.success) {
    redirect(profileNudgesPath(user.id));
  }

  const nudge = await prisma.nudge.findFirst({
    where: {
      id: parsed.data.nudgeId,
      recipientId: user.id,
      status: NudgeStatus.PENDING,
    },
    select: { id: true, senderId: true, recipientId: true },
  });

  if (!nudge) {
    redirect(profileNudgesPath(user.id));
  }

  await prisma.nudge.delete({ where: { id: nudge.id } });

  revalidateNudgeProfiles(nudge.senderId, nudge.recipientId);
}

export async function completeNudge(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = nudgeIdSchema.safeParse({ nudgeId: formData.get("nudgeId") });

  if (!parsed.success) {
    redirect(profileNudgesPath(user.id));
  }

  const nudge = await prisma.nudge.findFirst({
    where: {
      id: parsed.data.nudgeId,
      status: NudgeStatus.ACCEPTED,
      OR: [{ senderId: user.id }, { recipientId: user.id }],
    },
    select: { id: true, senderId: true, recipientId: true },
  });

  if (!nudge) {
    redirect(profileNudgesPath(user.id));
  }

  // Credit the recipient (the challenged solver) before removing the nudge.
  await prisma.$transaction([
    prisma.nudge.delete({ where: { id: nudge.id } }),
    prisma.profile.upsert({
      where: { userId: nudge.recipientId },
      update: { nudgesCompleted: { increment: 1 } },
      create: { userId: nudge.recipientId, nudgesCompleted: 1 },
    }),
  ]);

  revalidateNudgeProfiles(nudge.senderId, nudge.recipientId);
}

export async function cancelNudge(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = nudgeIdSchema.safeParse({ nudgeId: formData.get("nudgeId") });

  if (!parsed.success) {
    redirect(profileNudgesPath(user.id));
  }

  const nudge = await prisma.nudge.findFirst({
    where: {
      id: parsed.data.nudgeId,
      senderId: user.id,
      status: NudgeStatus.PENDING,
    },
    select: { id: true, senderId: true, recipientId: true },
  });

  if (!nudge) {
    redirect(profileNudgesPath(user.id));
  }

  await prisma.nudge.delete({ where: { id: nudge.id } });

  revalidateNudgeProfiles(nudge.senderId, nudge.recipientId);
}
