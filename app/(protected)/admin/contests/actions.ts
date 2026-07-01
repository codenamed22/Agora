"use server";

import { ContestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  computeRatingChanges,
  computeStandings,
  contestSchema,
  parseContestDate,
  syncContestRatingBadges,
} from "../../../../lib/contest";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "/admin/contests");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/admin/contests";
}

function parseContestForm(formData: FormData) {
  const parsed = contestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    slug: formData.get("slug"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    durationMinutes: formData.get("durationMinutes") || undefined,
  });

  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    startsAtDate: parseContestDate(parsed.data.startsAt),
    endsAtDate: parseContestDate(parsed.data.endsAt),
  };
}

export async function createContest(formData: FormData) {
  const admin = await requireAdmin();
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const parsed = parseContestForm(formData);

  if (!parsed) {
    redirect(`${returnTo}?error=invalid#create-contest`);
  }

  const existing = await prisma.contest.findUnique({
    where: { slug: parsed.slug },
    select: { id: true },
  });

  if (existing) {
    redirect(`${returnTo}?error=slug#create-contest`);
  }

  const contest = await prisma.contest.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      slug: parsed.slug,
      startsAt: parsed.startsAtDate,
      endsAt: parsed.endsAtDate,
      durationMinutes: parsed.durationMinutes,
      createdById: admin.id,
    },
    select: { id: true, slug: true },
  });

  revalidatePath("/contests");
  revalidatePath("/admin/contests");
  redirect(`/admin/contests/${contest.id}`);
}

export async function publishContest(formData: FormData) {
  await requireAdmin();
  const contestId = String(formData.get("contestId") ?? "");

  if (!contestId) {
    redirect("/admin/contests");
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { id: true, slug: true, _count: { select: { problems: true } } },
  });

  if (!contest || contest._count.problems === 0) {
    redirect(`/admin/contests/${contestId}?error=problems`);
  }

  await prisma.contest.update({
    where: { id: contestId },
    data: { status: ContestStatus.PUBLISHED },
  });

  revalidatePath("/contests");
  revalidatePath(`/contests/${contest.slug}`);
  revalidatePath("/admin/contests");
  revalidatePath(`/admin/contests/${contestId}`);
}

export async function addContestProblem(formData: FormData) {
  await requireAdmin();
  const contestId = String(formData.get("contestId") ?? "");
  const problemId = String(formData.get("problemId") ?? "");
  const label = String(formData.get("label") ?? "")
    .trim()
    .toUpperCase();
  const order = Number(formData.get("order") ?? 0);

  if (!contestId || !problemId || !label) {
    redirect("/admin/contests");
  }

  await prisma.contestProblem.create({
    data: { contestId, problemId, label, order },
  });

  revalidatePath(`/admin/contests/${contestId}`);
}

export async function removeContestProblem(formData: FormData) {
  await requireAdmin();
  const contestProblemId = String(formData.get("contestProblemId") ?? "");
  const contestId = String(formData.get("contestId") ?? "");

  if (!contestProblemId || !contestId) {
    redirect("/admin/contests");
  }

  await prisma.contestProblem.delete({ where: { id: contestProblemId } });

  revalidatePath(`/admin/contests/${contestId}`);
}

export async function finalizeContest(formData: FormData) {
  await requireAdmin();
  const contestId = String(formData.get("contestId") ?? "");

  if (!contestId) {
    redirect("/admin/contests");
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      slug: true,
      status: true,
      startsAt: true,
      endsAt: true,
      durationMinutes: true,
      registrations: { select: { userId: true, createdAt: true } },
      submissions: {
        select: {
          userId: true,
          contestProblemId: true,
          verdict: true,
          createdAt: true,
        },
      },
    },
  });

  if (!contest || contest.status === ContestStatus.FINALIZED) {
    redirect(`/admin/contests/${contestId}`);
  }

  if (contest.endsAt > new Date()) {
    redirect(`/admin/contests/${contestId}?error=not-ended`);
  }

  const startTimesByUser = new Map(
    contest.registrations.map((registration) => [registration.userId, registration.createdAt]),
  );
  const standings = computeStandings(contest.submissions, contest.startsAt, startTimesByUser);
  const standingByUser = new Map(standings.map((row) => [row.userId, row]));
  const participantIds = new Set([
    ...contest.registrations.map((registration) => registration.userId),
    ...standings.map((standing) => standing.userId),
  ]);

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: Array.from(participantIds) } },
    select: { userId: true, contestRating: true },
  });
  const ratingByUser = new Map(profiles.map((profile) => [profile.userId, profile.contestRating]));

  const ratingParticipants = Array.from(participantIds).map((userId) => ({
    userId,
    rank: standingByUser.get(userId)?.rank ?? participantIds.size,
    rating: ratingByUser.get(userId) ?? 1500,
  }));
  const ratingChanges = computeRatingChanges(ratingParticipants);
  const changeByUser = new Map(ratingChanges.map((change) => [change.userId, change]));

  await prisma.$transaction(async (tx) => {
    await tx.contestParticipant.deleteMany({ where: { contestId } });

    for (const userId of Array.from(participantIds)) {
      const standing = standingByUser.get(userId);
      const change = changeByUser.get(userId)!;
      const ratingBefore = ratingByUser.get(userId) ?? 1500;

      await tx.contestParticipant.create({
        data: {
          contestId,
          userId,
          rank: standing?.rank ?? participantIds.size,
          solvedCount: standing?.solvedCount ?? 0,
          penalty: standing?.penalty ?? 0,
          ratingBefore,
          ratingAfter: change.newRating,
          ratingDelta: change.delta,
        },
      });

      await tx.profile.upsert({
        where: { userId },
        update: { contestRating: change.newRating },
        create: { userId, contestRating: change.newRating },
      });
    }

    await tx.contest.update({
      where: { id: contestId },
      data: { status: ContestStatus.FINALIZED },
    });
  });

  for (const change of ratingChanges) {
    await syncContestRatingBadges(change.userId, change.newRating);
  }

  revalidatePath("/contests");
  revalidatePath(`/contests/${contest.slug}`);
  revalidatePath("/admin/contests");
  revalidatePath(`/admin/contests/${contestId}`);
  revalidatePath("/members");
}
