import { ResourceType, Role, UserStatus } from "@/prisma-client";
import { z } from "zod";

const httpsUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .max(2000)
  .refine((url) => url.startsWith("https://"), "Use an https:// URL");

const optionalHttpsUrl = httpsUrl.or(z.literal(""));

export const resourceSubmissionSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    author: z.string().trim().min(2).max(120),
    type: z.enum([ResourceType.BOOK, ResourceType.RESEARCH_PAPER]),
    categoryId: z.string().trim().min(1).max(100),
    recommendationReason: z.string().trim().min(20).max(1000),
    resourceLink: httpsUrl,
    buyLink: optionalHttpsUrl,
    imageUrl: optionalHttpsUrl,
  })
  .transform((submission) => ({
    ...submission,
    buyLink: submission.type === ResourceType.BOOK ? submission.buyLink || null : null,
    imageUrl: submission.imageUrl || null,
  }));

export type ResourceSubmissionInput = z.output<typeof resourceSubmissionSchema>;

export function canSubmitResource(user: { status: UserStatus } | null | undefined) {
  return user?.status === UserStatus.ACTIVE;
}

export function canReviewResource(user: { role: Role; status: UserStatus } | null | undefined) {
  return user?.role === Role.ADMIN && user.status === UserStatus.ACTIVE;
}
