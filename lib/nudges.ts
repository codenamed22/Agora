import { NudgeStatus } from "@prisma/client";
import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .refine((url) => url.startsWith("https://"), "Use an https:// URL")
  .or(z.literal(""))
  .transform((value) => value || null);

export const nudgeSchema = z.object({
  recipientId: z.string().trim().min(1),
  title: z.string().trim().min(2, "Add a short challenge title").max(140),
  message: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || null),
  link: optionalUrl,
});

export const NUDGE_STATUS_LABEL: Record<NudgeStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function nudgeStatusTone(status: NudgeStatus) {
  switch (status) {
    case NudgeStatus.PENDING:
      return "pending";
    case NudgeStatus.ACCEPTED:
      return "accepted";
    case NudgeStatus.COMPLETED:
      return "completed";
    case NudgeStatus.DECLINED:
    case NudgeStatus.CANCELLED:
      return "closed";
    default:
      return "pending";
  }
}

type NudgeActor = {
  senderId: string;
  recipientId: string;
  status: NudgeStatus;
};

export function canAccept(nudge: NudgeActor, userId: string) {
  return nudge.status === NudgeStatus.PENDING && nudge.recipientId === userId;
}

export function canDecline(nudge: NudgeActor, userId: string) {
  return nudge.status === NudgeStatus.PENDING && nudge.recipientId === userId;
}

export function canCancel(nudge: NudgeActor, userId: string) {
  return nudge.status === NudgeStatus.PENDING && nudge.senderId === userId;
}

export function canComplete(nudge: NudgeActor, userId: string) {
  return (
    nudge.status === NudgeStatus.ACCEPTED &&
    (nudge.senderId === userId || nudge.recipientId === userId)
  );
}
