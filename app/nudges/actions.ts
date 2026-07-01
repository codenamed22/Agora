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

function redirectWithError(returnTo: string, error: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}error=${error}`);
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
  redirect(returnTo);
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

  await prisma.nudge.update({
    where: { id: nudge.id },
    data: {
      status: NudgeStatus.DECLINED,
      acceptedAt: new Date(),
    },
  });

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

  await prisma.nudge.update({
    where: { id: nudge.id },
    data: {
      status: NudgeStatus.COMPLETED,
      completedAt: new Date(),
      completedById: user.id,
    },
  });

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

  await prisma.nudge.update({
    where: { id: nudge.id },
    data: { status: NudgeStatus.CANCELLED },
  });

  revalidateNudgeProfiles(nudge.senderId, nudge.recipientId);
}
