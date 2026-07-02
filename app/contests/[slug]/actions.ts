"use server";

import { ContestStatus, SubmissionVerdict } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isContestLive } from "../../../lib/contest";
import { requireActiveUser, requireAdmin } from "../../../lib/guards";
import { isSupportedLanguage, runJudge } from "../../../lib/judge";
import { prisma } from "../../../lib/prisma";

type ContestPreviewResult = {
  verdict: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  failureMessage?: string | null;
};

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

function previewError(message: string): ContestPreviewResult {
  return {
    verdict: SubmissionVerdict.RUNTIME_ERROR,
    passedCount: 0,
    totalCount: 0,
    runtimeMs: null,
    failureMessage: message,
  };
}

// Admin-only: run arbitrary code against a problem's tests without persisting
// anything. Used by the contest problem page in preview mode so admins can dry-run
// the reference (or any) solution against the real judge and test cases.
export async function runContestPreview(formData: FormData): Promise<ContestPreviewResult> {
  await requireAdmin();

  const problemSlug = String(formData.get("problemSlug") ?? "");
  const language = String(formData.get("language") ?? "");
  const code = String(formData.get("code") ?? "");

  if (!isSupportedLanguage(language)) {
    return previewError(`Unsupported language: ${language || "none"}.`);
  }
  if (code.trim().length === 0) {
    return previewError("Write some code before running.");
  }
  if (code.length > MAX_CODE_LENGTH) {
    return previewError("Code exceeds the maximum length.");
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: {
      timeLimitMs: true,
      testCases: {
        orderBy: { order: "asc" },
        select: { input: true, expectedOutput: true, isSample: true },
      },
    },
  });

  if (!problem || problem.testCases.length === 0) {
    return previewError("This problem has no test cases to run against.");
  }

  try {
    return await runJudge({
      code,
      language,
      testCases: problem.testCases,
      timeLimitMs: problem.timeLimitMs,
    });
  } catch (error) {
    return {
      verdict: SubmissionVerdict.RUNTIME_ERROR,
      passedCount: 0,
      totalCount: problem.testCases.length,
      runtimeMs: null,
      failureMessage: failureMessageFromError(error),
    };
  }
}
