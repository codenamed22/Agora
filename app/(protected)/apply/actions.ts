"use server";

import { ApplicationStatus, Prisma, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "../../../auth";
import { ensureRegistrationRecords } from "../../../lib/access";
import { getActiveCohort, parseQuestions } from "../../../lib/cohorts";
import { prisma } from "../../../lib/prisma";

const identitySchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  batch: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Select a graduation year"),
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
    redirect("/apply?error=missing-fields");
  }

  await ensureRegistrationRecords(session.user.id, session.user.email);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  // Server actions are callable directly, so re-check status server-side (not
  // only on the page). Only a PENDING user may submit.
  if (!user || user.status !== UserStatus.PENDING) {
    redirect(user?.status === UserStatus.ACTIVE ? "/dashboard" : "/apply");
  }

  const existing = await prisma.application.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  });

  // Only a DRAFT may be submitted. Bail if it was already submitted or decided
  // (e.g. an admin approved/rejected while the form was open).
  if (!existing || existing.status !== ApplicationStatus.DRAFT) {
    redirect("/apply");
  }

  const cohort = await getActiveCohort();
  if (!cohort) {
    redirect("/apply");
  }

  // Pin the submission to the cohort the form rendered for. If the active cohort
  // changed in between, reject instead of silently dropping the old answers.
  const formCohortId = String(formData.get("cohortId") ?? "");
  if (formCohortId !== cohort.id) {
    redirect("/apply?error=cohort-changed");
  }

  // Collect answers to the cohort's questions; enforce required ones.
  const questions = parseQuestions(cohort.questions);
  const answers: Record<string, string> = {};
  for (const question of questions) {
    const value = String(formData.get(`q_${question.id}`) ?? "").trim();
    if (question.required && !value) {
      redirect("/apply?error=missing-fields");
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
    prisma.application.update({
      where: { userId: session.user.id },
      data: {
        cohortId: cohort.id,
        status: ApplicationStatus.SUBMITTED,
        answers: answers as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/apply");
  redirect("/apply?submitted=1");
}
