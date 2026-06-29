"use server";

import { ApplicationStatus, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "../../../auth";
import { ensureRegistrationRecords } from "../../../lib/access";
import { prisma } from "../../../lib/prisma";

const applicationSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  batch: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Select a graduation year"),
  branch: z.string().trim().min(2).max(80),
  goals: z.string().trim().min(2).max(1000),
  experience: z.string().trim().max(1000).optional(),
});

export async function submitApplication(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  const parsed = applicationSchema.safeParse({
    displayName: formData.get("displayName"),
    batch: formData.get("batch"),
    branch: formData.get("branch"),
    goals: formData.get("goals"),
    experience: formData.get("experience") ?? "",
  });

  if (!parsed.success) {
    redirect("/apply?error=missing-fields");
  }

  await ensureRegistrationRecords(session.user.id, session.user.email);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  if (!user || user.status !== UserStatus.PENDING) {
    redirect(user?.status === UserStatus.ACTIVE ? "/dashboard" : "/apply");
  }

  const application = await prisma.application.findUnique({
    where: { userId: session.user.id },
  });

  if (application && application.status !== ApplicationStatus.DRAFT) {
    redirect("/apply");
  }

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName: parsed.data.displayName,
        batch: parsed.data.batch,
        branch: parsed.data.branch,
      },
      create: {
        userId: session.user.id,
        displayName: parsed.data.displayName,
        batch: parsed.data.batch,
        branch: parsed.data.branch,
      },
    }),
    application
      ? prisma.application.update({
          where: { id: application.id },
          data: {
            status: ApplicationStatus.SUBMITTED,
            goals: parsed.data.goals,
            experience: parsed.data.experience,
          },
        })
      : prisma.application.create({
          data: {
            userId: session.user.id,
            status: ApplicationStatus.SUBMITTED,
            goals: parsed.data.goals,
            experience: parsed.data.experience,
          },
        }),
  ]);

  revalidatePath("/apply");
  redirect("/apply?submitted=1");
}
