"use server";

import { ContestStatus } from "@/prisma-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  computeRatingChanges,
  computeStandings,
  contestSchema,
  DEFAULT_CONTEST_RATING,
  parseContestDate,
  personalContestStart,
  syncContestRatingBadges,
  tierForRating,
} from "../../../../lib/contest";
import { requireAdmin } from "../../../../lib/guards";
import { memberDisplayName } from "../../../../lib/members";
import {
  contestFinishedMessage,
  contestPublishedMessage,
  createNotification,
  rankUpMessage,
  shouldNotifyRankUp,
  withOverallRankNotifications,
} from "../../../../lib/notifications";
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
  const admin = await requireAdmin();
  const contestId = String(formData.get("contestId") ?? "");

  if (!contestId) {
    redirect("/admin/contests");
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      status: true,
      _count: { select: { problems: true } },
    },
  });

  if (!contest || contest._count.problems === 0) {
    redirect(`/admin/contests/${contestId}?error=problems`);
  }

  const wasPublished = contest.status !== ContestStatus.DRAFT;

  await prisma.contest.update({
    where: { id: contestId },
    data: { status: ContestStatus.PUBLISHED },
  });

  // Mirror the contest onto the Events tab. Upserting on the unique contestId
  // link keeps a single event in sync and never duplicates it on re-publish.
  await prisma.event.upsert({
    where: { contestId: contest.id },
    update: {
      title: contest.title,
      description: contest.description,
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
      published: true,
    },
    create: {
      title: contest.title,
      description: contest.description,
      location: "Online",
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
      published: true,
      createdById: admin.id,
      contestId: contest.id,
    },
  });

  // Announce a contest only the first time it leaves DRAFT, so re-publishing or
  // idempotent status writes never spam the feed with duplicates.
  if (!wasPublished) {
    await createNotification({
      type: "CONTEST_PUBLISHED",
      actorId: admin.id,
      message: contestPublishedMessage(contest.title),
      link: `/contests/${contest.slug}`,
    });
  }

  revalidatePath("/contests");
  revalidatePath(`/contests/${contest.slug}`);
  revalidatePath("/events");
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
      title: true,
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
    contest.registrations.map((registration) => [
      registration.userId,
      personalContestStart(contest, registration.createdAt),
    ]),
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
    rating: ratingByUser.get(userId) ?? DEFAULT_CONTEST_RATING,
  }));
  const ratingChanges = computeRatingChanges(ratingParticipants);
  const changeByUser = new Map(ratingChanges.map((change) => [change.userId, change]));

  await prisma.$transaction(async (tx) => {
    await tx.contestParticipant.deleteMany({ where: { contestId } });

    for (const userId of Array.from(participantIds)) {
      const standing = standingByUser.get(userId);
      const change = changeByUser.get(userId)!;
      const ratingBefore = ratingByUser.get(userId) ?? DEFAULT_CONTEST_RATING;

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

    // Release the contest's problems to the Practice tab now that it is over.
    await tx.problem.updateMany({
      where: { contestProblems: { some: { contestId } } },
      data: { published: true },
    });
  });

  await withOverallRankNotifications(async () => {
    for (const change of ratingChanges) {
      await syncContestRatingBadges(change.userId, change.newRating);
    }
  });

  const participants = await prisma.user.findMany({
    where: { id: { in: Array.from(participantIds) } },
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { displayName: true } },
    },
  });
  const nameByUser = new Map(participants.map((participant) => [participant.id, participant]));

  for (const change of ratingChanges) {
    const ratingBefore = ratingByUser.get(change.userId) ?? DEFAULT_CONTEST_RATING;

    if (!shouldNotifyRankUp(ratingBefore, change.newRating)) {
      continue;
    }

    const actor = nameByUser.get(change.userId);

    await createNotification({
      type: "RANK_UP",
      actorId: change.userId,
      message: rankUpMessage(
        actor ? memberDisplayName(actor) : "A ShardUp member",
        tierForRating(change.newRating).label,
      ),
      link: `/members/${change.userId}`,
    });
  }

  const winnerId = standings.find((standing) => standing.rank === 1)?.userId;
  const winner = winnerId ? nameByUser.get(winnerId) : undefined;

  await createNotification({
    type: "CONTEST_FINISHED",
    message: contestFinishedMessage(contest.title, winner ? memberDisplayName(winner) : null),
    link: `/contests/${contest.slug}`,
  });

  revalidatePath("/contests");
  revalidatePath(`/contests/${contest.slug}`);
  revalidatePath("/admin/contests");
  revalidatePath(`/admin/contests/${contestId}`);
  revalidatePath("/members");
  revalidatePath("/problems");
}
