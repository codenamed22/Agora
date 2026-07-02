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

export type SendNudgeState = { ok: boolean; error?: string };

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

// Returns a result state (instead of redirecting) so the client modal can close
// itself on success — a server-action redirect can't update the URL hash that the
// :target modal relies on, which left the dialog stuck open.
export async function sendNudge(
  _prevState: SendNudgeState,
  formData: FormData,
): Promise<SendNudgeState> {
  const user = await requireActiveUser();

  const parsed = nudgeSchema.safeParse({
    recipientId: formData.get("recipientId"),
    title: formData.get("title"),
    message: formData.get("message"),
    link: formData.get("link"),
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const data = parsed.data;

  if (data.recipientId === user.id) {
    return { ok: false, error: "self" };
  }

  const recipient = await getActiveRecipient(data.recipientId);

  if (!recipient) {
    return { ok: false, error: "recipient" };
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
  return { ok: true };
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
