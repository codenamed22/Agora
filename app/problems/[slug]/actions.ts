"use server";

import { SubmissionVerdict, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "../../../auth";
import { isSupportedLanguage, runJudge } from "../../../lib/judge";
import { prisma } from "../../../lib/prisma";

const DAILY_SUBMISSION_LIMIT = 50;
const MAX_CODE_LENGTH = 20_000;

const submissionSchema = z.object({
  problemSlug: z.string().trim().min(1),
  language: z.string().trim().min(1),
  code: z.string().max(MAX_CODE_LENGTH),
});

async function requireActiveUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  if (session.user.status !== UserStatus.ACTIVE) {
    redirect("/apply");
  }

  return session.user;
}

export async function submitSolution(formData: FormData) {
  const user = await requireActiveUser();
  const parsed = submissionSchema.safeParse({
    problemSlug: formData.get("problemSlug"),
    language: formData.get("language"),
    code: formData.get("code"),
  });

  if (
    !parsed.success ||
    !isSupportedLanguage(parsed.data.language) ||
    parsed.data.code.trim().length === 0
  ) {
    redirect("/problems");
  }

  const problem = await prisma.problem.findFirst({
    where: { slug: parsed.data.problemSlug, published: true },
    select: {
      id: true,
      slug: true,
      timeLimitMs: true,
      testCases: {
        orderBy: { order: "asc" },
        select: { input: true, expectedOutput: true },
      },
    },
  });

  if (!problem || problem.testCases.length === 0) {
    redirect("/problems");
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentSubmissionCount = await prisma.submission.count({
    where: { userId: user.id, createdAt: { gte: since } },
  });

  if (recentSubmissionCount >= DAILY_SUBMISSION_LIMIT) {
    redirect(`/problems/${problem.slug}?error=rate-limit`);
  }

  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId: problem.id,
      language: parsed.data.language,
      code: parsed.data.code,
      totalCount: problem.testCases.length,
    },
    select: { id: true },
  });

  try {
    const result = await runJudge({
      code: parsed.data.code,
      language: parsed.data.language,
      testCases: problem.testCases,
      timeLimitMs: problem.timeLimitMs,
    });

    await prisma.submission.update({
      where: { id: submission.id },
      data: result,
    });
  } catch {
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        verdict: SubmissionVerdict.RUNTIME_ERROR,
        passedCount: 0,
        totalCount: problem.testCases.length,
      },
    });
  }

  revalidatePath("/problems");
  revalidatePath(`/problems/${problem.slug}`);
}
