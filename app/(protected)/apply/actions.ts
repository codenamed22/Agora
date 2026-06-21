"use server";

import { ApplicationStatus, Prisma, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "../../../auth";
import { ensureRegistrationRecords } from "../../../lib/access";
import { parseQuestions } from "../../../lib/cohorts";
import { prisma } from "../../../lib/prisma";

const identitySchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  batch: z.string().trim().min(2).max(40),
  branch: z.string().trim().min(2).max(80),
});

export async function submitApplication(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  const identity = identitySchema.safeParse({
    displayName: formData.get("displayName"),
    batch: formData.get("batch"),
    branch: formData.get("branch"),
  });

  if (!identity.success) {
    redirect("/apply?error=1");
  }

  await ensureRegistrationRecords(session.user.id, session.user.email);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  if (!user || user.status !== UserStatus.PENDING) {
    redirect(user?.status === UserStatus.ACTIVE ? "/dashboard" : "/apply");
  }

  const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
  if (!cohort) {
    redirect("/apply");
  }

  // Collect answers to the cohort's questions; enforce required ones.
  const questions = parseQuestions(cohort.questions);
  const answers: Record<string, string> = {};
  for (const question of questions) {
    const value = String(formData.get(`q_${question.id}`) ?? "").trim();
    if (question.required && !value) {
      redirect("/apply?error=1");
    }
    if (value) {
      answers[question.id] = value;
    }
  }

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName: identity.data.displayName,
        batch: identity.data.batch,
        branch: identity.data.branch,
      },
      create: {
        userId: session.user.id,
        displayName: identity.data.displayName,
        batch: identity.data.batch,
        branch: identity.data.branch,
      },
    }),
    prisma.application.upsert({
      where: { userId: session.user.id },
      update: {
        cohortId: cohort.id,
        status: ApplicationStatus.SUBMITTED,
        answers: answers as Prisma.InputJsonValue,
      },
      create: {
        userId: session.user.id,
        cohortId: cohort.id,
        status: ApplicationStatus.SUBMITTED,
        answers: answers as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/apply");
  redirect("/apply?submitted=1");
}
