import { ContestStatus, SubmissionVerdict } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { memberDisplayName } from "./members";
import { prisma } from "./prisma";

export const DEFAULT_CONTEST_RATING = 1500;
// LeetCode-style: each wrong submission on a solved problem adds 5 minutes.
export const CONTEST_WRONG_PENALTY_MINUTES = 5;

export const RATING_TIER_BADGES = [
  { name: "Rough Shard", label: "Rough", slug: "rough", color: "#6b7280", minRating: 0, maxRating: 1199 },
  { name: "Cut Shard", label: "Cut", slug: "cut", color: "#2f9e44", minRating: 1200, maxRating: 1399 },
  {
    name: "Polished Shard",
    label: "Polished",
    slug: "polished",
    color: "#1971c2",
    minRating: 1400,
    maxRating: 1599,
  },
  {
    name: "Radiant Shard",
    label: "Radiant",
    slug: "radiant",
    color: "#7048e8",
    minRating: 1600,
    maxRating: 1899,
  },
  {
    name: "Molten Shard",
    label: "Molten",
    slug: "molten",
    color: "#e8590c",
    minRating: 1900,
    maxRating: Number.POSITIVE_INFINITY,
  },
] as const;

export const AUTO_ASSIGNED_BADGE_NAMES = new Set<string>(
  RATING_TIER_BADGES.map((tier) => tier.name),
);

export type ContestSubmissionRow = {
  userId: string;
  contestProblemId: string;
  verdict: SubmissionVerdict;
  createdAt: Date;
};

export type StandingRow = {
  userId: string;
  solvedCount: number;
  penalty: number;
  lastAcAt: Date | null;
  rank: number;
};

export type RatingParticipant = {
  userId: string;
  rank: number;
  rating: number;
};

export type RatingChange = {
  userId: string;
  delta: number;
  newRating: number;
};

type ContestTiming = {
  status: ContestStatus;
  startsAt: Date;
  endsAt: Date;
  durationMinutes?: number | null;
};

export const contestSchema = z
  .object({
    title: z.string().trim().min(2).max(140),
    description: z.string().trim().min(2).max(4000),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
    startsAt: z.string().trim().min(1),
    endsAt: z.string().trim().min(1),
    durationMinutes: z.coerce.number().int().min(15).max(480),
  })
  .refine((contest) => new Date(contest.endsAt) > new Date(contest.startsAt), {
    message: "End time must be after the start time.",
    path: ["endsAt"],
  });

export function tierForRating(rating: number) {
  return (
    RATING_TIER_BADGES.find((tier) => rating >= tier.minRating && rating <= tier.maxRating) ??
    RATING_TIER_BADGES[0]
  );
}

export function contestPhase(
  contest: ContestTiming,
  now = new Date(),
  registrationStartedAt?: Date | null,
) {
  if (contest.status === ContestStatus.DRAFT) {
    return "draft" as const;
  }

  if (contest.status === ContestStatus.FINALIZED) {
    return "finalized" as const;
  }

  if (now < contest.startsAt) {
    return "upcoming" as const;
  }

  if (now > contest.endsAt) {
    return "finished" as const;
  }

  if (registrationStartedAt) {
    return now <= contestWindowForUser(contest, registrationStartedAt).endsAt
      ? ("running" as const)
      : ("finished" as const);
  }

  return "running" as const;
}

export function contestDurationMinutes(contest: {
  startsAt: Date;
  endsAt: Date;
  durationMinutes?: number | null;
}) {
  return (
    contest.durationMinutes ??
    Math.max(1, Math.floor((contest.endsAt.getTime() - contest.startsAt.getTime()) / 60_000))
  );
}

export function contestWindowForUser(contest: ContestTiming, registrationStartedAt?: Date | null) {
  if (registrationStartedAt) {
    const startsAt = registrationStartedAt;
    const personalEnd = new Date(startsAt.getTime() + contestDurationMinutes(contest) * 60_000);
    const endsAt = personalEnd < contest.endsAt ? personalEnd : contest.endsAt;

    return { startsAt, endsAt };
  }

  return { startsAt: contest.startsAt, endsAt: contest.endsAt };
}

export function isContestLive(
  contest: ContestTiming,
  now = new Date(),
  registrationStartedAt?: Date | null,
) {
  return contestPhase(contest, now, registrationStartedAt) === "running";
}

function minutesFromStart(startsAt: Date, at: Date) {
  return Math.max(0, Math.floor((at.getTime() - startsAt.getTime()) / 60_000));
}

export function computeStandings(
  submissions: ContestSubmissionRow[],
  startsAt: Date,
  startTimesByUser: Map<string, Date> = new Map(),
): StandingRow[] {
  const byUserProblem = new Map<string, ContestSubmissionRow[]>();

  for (const submission of submissions) {
    const key = `${submission.userId}:${submission.contestProblemId}`;
    const bucket = byUserProblem.get(key) ?? [];
    bucket.push(submission);
    byUserProblem.set(key, bucket);
  }

  const stats = new Map<string, { solvedCount: number; penalty: number; lastAcAt: Date | null }>();

  for (const [key, attempts] of Array.from(byUserProblem.entries())) {
    const userId = key.split(":")[0]!;
    const ordered = [...attempts].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );
    const acceptedIndex = ordered.findIndex(
      (attempt) => attempt.verdict === SubmissionVerdict.ACCEPTED,
    );

    if (acceptedIndex < 0) {
      continue;
    }

    const accepted = ordered[acceptedIndex]!;
    const wrongBefore = ordered
      .slice(0, acceptedIndex)
      .filter((attempt) => attempt.verdict !== SubmissionVerdict.PENDING).length;
    const problemPenalty =
      minutesFromStart(startTimesByUser.get(userId) ?? startsAt, accepted.createdAt) +
      wrongBefore * CONTEST_WRONG_PENALTY_MINUTES;

    const current = stats.get(userId) ?? { solvedCount: 0, penalty: 0, lastAcAt: null };
    current.solvedCount += 1;
    current.penalty += problemPenalty;
    current.lastAcAt =
      !current.lastAcAt || accepted.createdAt > current.lastAcAt
        ? accepted.createdAt
        : current.lastAcAt;
    stats.set(userId, current);
  }

  const ranked = Array.from(stats.entries())
    .map(([userId, row]) => ({ userId, ...row }))
    .sort(
      (left, right) =>
        right.solvedCount - left.solvedCount ||
        left.penalty - right.penalty ||
        (left.lastAcAt?.getTime() ?? 0) - (right.lastAcAt?.getTime() ?? 0),
    );

  return ranked.map((row, index) => ({
    userId: row.userId,
    solvedCount: row.solvedCount,
    penalty: row.penalty,
    lastAcAt: row.lastAcAt,
    rank: index + 1,
  }));
}

export function computeRatingChanges(participants: RatingParticipant[]): RatingChange[] {
  if (participants.length === 0) {
    return [];
  }

  if (participants.length === 1) {
    const only = participants[0]!;

    return [{ userId: only.userId, delta: 0, newRating: only.rating }];
  }

  const K = 32;

  const changes = participants.map((participant) => {
    let expected = 0;
    let actual = 0;

    for (const opponent of participants) {
      if (opponent.userId === participant.userId) {
        continue;
      }

      expected += 1 / (1 + 10 ** ((opponent.rating - participant.rating) / 400));

      if (participant.rank < opponent.rank) {
        actual += 1;
      } else if (participant.rank === opponent.rank) {
        actual += 0.5;
      }
    }

    const delta = Math.round((K / (participants.length - 1)) * (actual - expected));

    return {
      userId: participant.userId,
      delta,
      newRating: participant.rating + delta,
    };
  });

  const totalDelta = changes.reduce((sum, change) => sum + change.delta, 0);
  const adjust = -Math.round(totalDelta / participants.length);

  return changes.map((change) => ({
    ...change,
    delta: change.delta + adjust,
    newRating: change.newRating + adjust,
  }));
}

type ContestUser = {
  id: string;
  name: string | null;
  email: string;
  profile?: { displayName: string | null } | null;
};

export function standingsWithNames(standings: StandingRow[], users: ContestUser[]) {
  const userById = new Map(users.map((user) => [user.id, user]));

  return standings.map((standing) => ({
    ...standing,
    name: userById.get(standing.userId)
      ? memberDisplayName(userById.get(standing.userId)!)
      : "ShardUp member",
  }));
}

export async function syncContestRatingBadges(userId: string, rating: number) {
  const tier = tierForRating(rating);
  const tierBadgeNames = RATING_TIER_BADGES.map((entry) => entry.name);
  const badges = await prisma.badge.findMany({
    where: { name: { in: tierBadgeNames } },
    include: { members: { where: { userId }, select: { id: true } } },
  });
  const badgeByName = new Map(badges.map((badge) => [badge.name, badge]));
  const targetBadge = badgeByName.get(tier.name);

  if (!targetBadge) {
    return;
  }

  const removeBadgeIds = badges
    .filter((badge) => badge.name !== tier.name)
    .map((badge) => badge.id);

  await prisma.$transaction([
    ...(removeBadgeIds.length
      ? [prisma.memberBadge.deleteMany({ where: { userId, badgeId: { in: removeBadgeIds } } })]
      : []),
    prisma.memberBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: targetBadge.id } },
      update: {},
      create: { userId, badgeId: targetBadge.id },
    }),
  ]);

  revalidatePath("/members");
  revalidatePath(`/members/${userId}`);
  revalidatePath(`/badges/${targetBadge.id}`);
}

export function formatContestWindow(startsAt: Date, endsAt: Date) {
  const formatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  return `${formatter.format(startsAt)} – ${formatter.format(endsAt)} IST`;
}

export function formatContestTiming(contest: {
  startsAt: Date;
  endsAt: Date;
  durationMinutes?: number | null;
}) {
  return `${contestDurationMinutes(contest)}-minute contest · start anytime`;
}

export function toContestInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function parseContestDate(value: string) {
  const date = new Date(`${value}:00+05:30`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid contest date");
  }

  return date;
}
