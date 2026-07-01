"use server";

import { ContestStatus, SubmissionVerdict } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isContestLive } from "../../../lib/contest";
import { requireActiveUser } from "../../../lib/guards";
import { isSupportedLanguage, runJudge } from "../../../lib/judge";
import { prisma } from "../../../lib/prisma";

const DAILY_SUBMISSION_LIMIT = 50;
const MAX_CODE_LENGTH = 20_000;
const FAILURE_MESSAGE_LIMIT = 4_000;

const contestSlugSchema = z.object({
  contestSlug: z.string().trim().min(1),
});

const submissionSchema = z.object({
  contestSlug: z.string().trim().min(1),
  problemLabel: z.string().trim().min(1),
  language: z.string().trim().min(1),
  code: z.string().max(MAX_CODE_LENGTH),
});

function failureMessageFromError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Judge service failed before the submission could complete.";
  return message.replace(/\s+/g, " ").trim().slice(0, FAILURE_MESSAGE_LIMIT);
}

export async function registerForContest(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = contestSlugSchema.safeParse({ contestSlug: formData.get("contestSlug") });

  if (!parsed.success) {
    redirect("/contests");
  }

  const contest = await prisma.contest.findFirst({
    where: {
      slug: parsed.data.contestSlug,
      status: { in: [ContestStatus.PUBLISHED, ContestStatus.FINALIZED] },
    },
    select: { id: true, slug: true, startsAt: true, endsAt: true },
  });

  const now = new Date();

  if (!contest || now < contest.startsAt || contest.endsAt < now) {
    redirect("/contests");
  }

  await prisma.contestRegistration.upsert({
    where: { contestId_userId: { contestId: contest.id, userId: user.id } },
    update: {},
    create: { contestId: contest.id, userId: user.id },
  });

  revalidatePath("/contests");
  revalidatePath(`/contests/${contest.slug}`);
}

export async function submitContestSolution(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = submissionSchema.safeParse({
    contestSlug: formData.get("contestSlug"),
    problemLabel: formData.get("problemLabel"),
    language: formData.get("language"),
    code: formData.get("code"),
  });

  if (
    !parsed.success ||
    !isSupportedLanguage(parsed.data.language) ||
    parsed.data.code.trim().length === 0
  ) {
    redirect("/contests");
  }

  const contest = await prisma.contest.findFirst({
    where: { slug: parsed.data.contestSlug, status: ContestStatus.PUBLISHED },
    select: {
      id: true,
      slug: true,
      startsAt: true,
      endsAt: true,
      status: true,
      durationMinutes: true,
    },
  });

  if (!contest) {
    redirect(`/contests/${parsed.data.contestSlug}`);
  }

  const registration = await prisma.contestRegistration.findUnique({
    where: { contestId_userId: { contestId: contest.id, userId: user.id } },
    select: { id: true, createdAt: true },
  });

  if (!registration) {
    redirect(`/contests/${contest.slug}?error=register`);
  }

  if (!isContestLive(contest, new Date(), registration.createdAt)) {
    redirect(`/contests/${parsed.data.contestSlug}`);
  }

  const contestProblem = await prisma.contestProblem.findFirst({
    where: { contestId: contest.id, label: parsed.data.problemLabel },
    select: {
      id: true,
      problem: {
        select: {
          timeLimitMs: true,
          testCases: {
            orderBy: { order: "asc" },
            select: { input: true, expectedOutput: true, isSample: true },
          },
        },
      },
    },
  });

  if (!contestProblem || contestProblem.problem.testCases.length === 0) {
    redirect(`/contests/${contest.slug}`);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentSubmissionCount = await prisma.contestSubmission.count({
    where: { userId: user.id, createdAt: { gte: since } },
  });

  if (recentSubmissionCount >= DAILY_SUBMISSION_LIMIT) {
    redirect(`/contests/${contest.slug}/problems/${parsed.data.problemLabel}?error=rate-limit`);
  }

  const submission = await prisma.contestSubmission.create({
    data: {
      contestId: contest.id,
      contestProblemId: contestProblem.id,
      userId: user.id,
      language: parsed.data.language,
      code: parsed.data.code,
      totalCount: contestProblem.problem.testCases.length,
    },
    select: { id: true },
  });

  try {
    const result = await runJudge({
      code: parsed.data.code,
      language: parsed.data.language,
      testCases: contestProblem.problem.testCases,
      timeLimitMs: contestProblem.problem.timeLimitMs,
    });

    await prisma.contestSubmission.update({
      where: { id: submission.id },
      data: result,
    });
  } catch (error) {
    await prisma.contestSubmission.update({
      where: { id: submission.id },
      data: {
        verdict: SubmissionVerdict.RUNTIME_ERROR,
        passedCount: 0,
        totalCount: contestProblem.problem.testCases.length,
        failureMessage: failureMessageFromError(error),
      },
    });
  }

  revalidatePath("/contests");
  revalidatePath(`/contests/${contest.slug}`);
  revalidatePath(`/contests/${contest.slug}/problems/${parsed.data.problemLabel}`);
}
