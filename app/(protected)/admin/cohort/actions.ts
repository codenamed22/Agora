"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseQuestions, type CohortQuestion } from "../../../../lib/cohorts";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";

const yearSchema = z.coerce.number().int().min(2000).max(2100);

// Open a cohort for a year (or reactivate one) and make it the single active cohort.
export async function setActiveCohort(formData: FormData) {
  await requireAdmin();

  const parsed = yearSchema.safeParse(formData.get("year"));
  if (!parsed.success) {
    redirect("/admin/cohort?error=invalid-year");
  }

  const year = parsed.data;
  const existing = await prisma.cohort.findUnique({ where: { year } });

  await prisma.$transaction([
    prisma.cohort.updateMany({ data: { isActive: false } }),
    existing
      ? prisma.cohort.update({ where: { id: existing.id }, data: { isActive: true } })
      : prisma.cohort.create({ data: { year, isActive: true } }),
  ]);

  revalidatePath("/admin/cohort");
  redirect("/admin/cohort");
}

// End recruitment for a cohort. No active cohort remains until a new one is opened.
export async function endCohort(formData: FormData) {
  await requireAdmin();

  const cohortId = String(formData.get("cohortId") ?? "");
  if (!cohortId) {
    return;
  }

  await prisma.cohort.update({ where: { id: cohortId }, data: { isActive: false } });

  revalidatePath("/admin/cohort");
  revalidatePath(`/admin/cohort/${cohortId}`);
  revalidatePath("/apply");
}

const editSchema = z.object({
  cohortId: z.string().min(1),
  action: z.enum(["add", "update", "remove", "up", "down"]),
  questionId: z.string().optional(),
  label: z.string().trim().max(300).optional(),
  required: z.string().optional(),
});

// Add / reword / remove / reorder a cohort's questions. Question ids stay stable
// so existing answers remain attached.
export async function editQuestion(formData: FormData) {
  await requireAdmin();

  const parsed = editSchema.safeParse({
    cohortId: formData.get("cohortId"),
    action: formData.get("action"),
    questionId: formData.get("questionId") ?? undefined,
    label: formData.get("label") ?? undefined,
    required: formData.get("required") ?? undefined,
  });
  if (!parsed.success) {
    redirect("/admin/cohort");
  }

  const cohort = await prisma.cohort.findUnique({ where: { id: parsed.data.cohortId } });
  if (!cohort) {
    redirect("/admin/cohort");
  }

  // Don't edit an ended cohort — that would relabel/hide historical answers.
  if (!cohort.isActive) {
    redirect(`/admin/cohort/${cohort.id}`);
  }

  const questions = parseQuestions(cohort.questions);
  const { action, questionId } = parsed.data;
  const label = parsed.data.label?.trim() ?? "";
  const required = parsed.data.required === "on";

  let next: CohortQuestion[] = questions;

  if (action === "add") {
    if (label) {
      next = [...questions, { id: crypto.randomUUID(), label, required }];
    }
  } else if (action === "update" && questionId) {
    next = questions.map((question) =>
      question.id === questionId
        ? { ...question, label: label || question.label, required }
        : question,
    );
  } else if (action === "remove" && questionId) {
    next = questions.filter((question) => question.id !== questionId);
  } else if ((action === "up" || action === "down") && questionId) {
    const index = questions.findIndex((question) => question.id === questionId);
    const target = action === "up" ? index - 1 : index + 1;
    if (index !== -1 && target >= 0 && target < questions.length) {
      next = [...questions];
      [next[index], next[target]] = [next[target], next[index]];
    }
  }

  await prisma.cohort.update({
    where: { id: cohort.id },
    data: { questions: next as unknown as Prisma.InputJsonValue },
  });

  revalidatePath(`/admin/cohort/${cohort.id}`);
  revalidatePath("/apply");
}
