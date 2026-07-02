/**
 * End-to-end contest rating simulation (no judge / DB required).
 * Run: npx tsx scripts/simulate-contest-ratings.ts
 * With DB: DATABASE_URL=... npx tsx scripts/simulate-contest-ratings.ts --db
 */
import { ContestStatus, Role, SubmissionVerdict, UserStatus } from "@prisma/client";
import {
  computeRatingChanges,
  computeStandings,
  DEFAULT_CONTEST_RATING,
  tierForRating,
  type ContestSubmissionRow,
} from "../lib/contest";

const startsAt = new Date("2026-07-01T10:00:00.000Z");

const USERS = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
  { id: "cara", name: "Cara" },
  { id: "dan", name: "Dan" },
] as const;

const PROBLEMS = [
  { id: "prob-a", label: "A" },
  { id: "prob-b", label: "B" },
] as const;

function at(minutes: number) {
  return new Date(startsAt.getTime() + minutes * 60_000);
}

function sub(
  userId: string,
  contestProblemId: string,
  verdict: SubmissionVerdict,
  minutes: number,
): ContestSubmissionRow {
  return { userId, contestProblemId, verdict, createdAt: at(minutes) };
}

/** Scripted contest: Alice solves both (with a WA on B), Bob solves A fast, Cara solves B after WA, Dan DNF. */
const SUBMISSIONS: ContestSubmissionRow[] = [
  sub("bob", "prob-a", SubmissionVerdict.ACCEPTED, 8),
  sub("alice", "prob-a", SubmissionVerdict.ACCEPTED, 12),
  sub("cara", "prob-b", SubmissionVerdict.WRONG_ANSWER, 25),
  sub("cara", "prob-b", SubmissionVerdict.ACCEPTED, 40),
  sub("alice", "prob-b", SubmissionVerdict.WRONG_ANSWER, 30),
  sub("alice", "prob-b", SubmissionVerdict.ACCEPTED, 55),
  sub("dan", "prob-a", SubmissionVerdict.WRONG_ANSWER, 50),
  sub("dan", "prob-b", SubmissionVerdict.TLE, 70),
];

function printTable(headers: string[], rows: string[][]) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => (row[i] ?? "").length)),
  );
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i]!)).join("  ");
  console.log(line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) {
    console.log(line(row));
  }
}

function simulatePure() {
  console.log("\n=== Contest rating simulation (pure logic) ===\n");
  console.log(`Window: ${startsAt.toISOString()} + 2h`);
  console.log(`Problems: ${PROBLEMS.map((p) => p.label).join(", ")}`);
  console.log(`Participants: ${USERS.map((u) => u.name).join(", ")}\n`);

  const standings = computeStandings(SUBMISSIONS, startsAt);
  const nameById = new Map(USERS.map((u) => [u.id, u.name]));

  console.log("Standings (ICPC: solved desc, penalty asc):");
  printTable(
    ["Rank", "Name", "Solved", "Penalty"],
    standings.map((s) => [
      String(s.rank),
      nameById.get(s.userId) ?? s.userId,
      String(s.solvedCount),
      String(s.penalty),
    ]),
  );

  const registeredIds = USERS.map((u) => u.id);
  const standingByUser = new Map(standings.map((s) => [s.userId, s]));
  const ratings = new Map(registeredIds.map((id) => [id, DEFAULT_CONTEST_RATING]));

  const ratingParticipants = registeredIds.map((userId) => ({
    userId,
    rank: standingByUser.get(userId)?.rank ?? registeredIds.length,
    rating: ratings.get(userId) ?? DEFAULT_CONTEST_RATING,
  }));

  const changes = computeRatingChanges(ratingParticipants);
  const changeByUser = new Map(changes.map((c) => [c.userId, c]));

  console.log("\nRating changes (all start at 1500):");
  printTable(
    ["Name", "Rank", "Before", "Delta", "After", "Tier"],
    registeredIds.map((userId) => {
      const change = changeByUser.get(userId)!;
      const rank = standingByUser.get(userId)?.rank ?? registeredIds.length;
      return [
        nameById.get(userId) ?? userId,
        String(rank),
        String(change.newRating - change.delta),
        change.delta >= 0 ? `+${change.delta}` : String(change.delta),
        String(change.newRating),
        tierForRating(change.newRating).label,
      ];
    }),
  );

  const totalDelta = changes.reduce((sum, c) => sum + c.delta, 0);
  console.log(`\nTotal rating delta (should be 0): ${totalDelta}`);

  const winner = changes.find((c) => c.userId === standings[0]?.userId);
  const lastPlace = changes.find(
    (c) => c.userId === ratingParticipants.sort((a, b) => b.rank - a.rank)[0]?.userId,
  );
  console.log(
    `Winner (${nameById.get(standings[0]!.userId)}): ${winner!.delta >= 0 ? "gained" : "lost"} rating`,
  );
  console.log(
    `Last place (${nameById.get(lastPlace!.userId)}): ${lastPlace!.delta <= 0 ? "lost" : "gained"} rating`,
  );

  if (totalDelta !== 0) {
    console.error("\nFAIL: rating changes are not zero-sum");
    process.exitCode = 1;
    return;
  }
  if ((winner?.delta ?? 0) <= 0) {
    console.error("\nFAIL: winner should gain rating");
    process.exitCode = 1;
    return;
  }
  console.log("\nPASS: ratings behave as expected.\n");
}

async function ensureSimUsers(prisma: Awaited<typeof import("../lib/prisma")>["prisma"]) {
  const admin = await prisma.user.upsert({
    where: { email: "admin@shardup.local" },
    update: { role: Role.ADMIN, status: UserStatus.ACTIVE, name: "Local Admin" },
    create: {
      email: "admin@shardup.local",
      name: "Local Admin",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: { id: true, email: true },
  });

  const simNames = ["Sim Alice", "Sim Bob", "Sim Cara", "Sim Dan"];
  for (const [index, name] of simNames.entries()) {
    const email = `sim-member-${index + 1}@shardup.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { status: UserStatus.ACTIVE, name },
      create: { email, name, role: Role.MEMBER, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { displayName: name, contestRating: DEFAULT_CONTEST_RATING },
      create: { userId: user.id, displayName: name, contestRating: DEFAULT_CONTEST_RATING },
    });
  }

  const members = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      id: { not: admin.id },
      email: { startsWith: "sim-member-" },
    },
    orderBy: { email: "asc" },
    include: { profile: { select: { displayName: true, contestRating: true } } },
  });

  return { admin, members };
}

async function simulateDb() {
  const { prisma } = await import("../lib/prisma");

  console.log("\n=== Contest rating simulation (database) ===\n");

  const { admin, members } = await ensureSimUsers(prisma);

  if (members.length < 3) {
    console.error(`Need at least 3 active members, found ${members.length}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Using admin ${admin.email} and ${members.length} sim members.\n`);

  const problem = await prisma.problem.findFirst({
    where: { published: false },
    select: { id: true },
  });
  if (!problem) {
    console.error("No unpublished problem found for contest.");
    process.exitCode = 1;
    return;
  }

  const slug = `sim-contest-${Date.now()}`;
  const simStarts = new Date(Date.now() - 3 * 60 * 60_000);
  const simEnds = new Date(Date.now() - 60_000);

  const contest = await prisma.contest.create({
    data: {
      title: "Rating simulation",
      description: "Auto-generated contest for rating verification.",
      slug,
      startsAt: simStarts,
      endsAt: simEnds,
      status: ContestStatus.PUBLISHED,
      createdById: admin.id,
      problems: {
        create: [{ problemId: problem.id, label: "A", order: 0 }],
      },
    },
    include: { problems: true },
  });

  const contestProblemId = contest.problems[0]!.id;
  const [alice, bob, cara] = members;

  for (const userId of members.map((m) => m.id)) {
    await prisma.contestRegistration.upsert({
      where: { contestId_userId: { contestId: contest.id, userId } },
      update: {},
      create: { contestId: contest.id, userId },
    });
  }

  const base = simStarts.getTime();
  const submissions = [
    { userId: bob!.id, verdict: SubmissionVerdict.ACCEPTED, offsetMin: 8 },
    { userId: alice!.id, verdict: SubmissionVerdict.ACCEPTED, offsetMin: 15 },
    { userId: cara!.id, verdict: SubmissionVerdict.WRONG_ANSWER, offsetMin: 20 },
    { userId: cara!.id, verdict: SubmissionVerdict.ACCEPTED, offsetMin: 35 },
  ];

  for (const row of submissions) {
    await prisma.contestSubmission.create({
      data: {
        contestId: contest.id,
        contestProblemId,
        userId: row.userId,
        language: "python",
        code: "print(0)",
        verdict: row.verdict,
        runtimeMs: 10,
        passedCount: row.verdict === SubmissionVerdict.ACCEPTED ? 1 : 0,
        totalCount: 1,
        createdAt: new Date(base + row.offsetMin * 60_000),
      },
    });
  }

  const loaded = await prisma.contest.findUnique({
    where: { id: contest.id },
    select: {
      id: true,
      startsAt: true,
      registrations: { select: { userId: true } },
      submissions: {
        select: { userId: true, contestProblemId: true, verdict: true, createdAt: true },
      },
    },
  });

  const standings = computeStandings(loaded!.submissions, loaded!.startsAt);
  const participantIds = new Set([
    ...loaded!.registrations.map((r) => r.userId),
    ...standings.map((s) => s.userId),
  ]);
  const profiles = await prisma.profile.findMany({
    where: { userId: { in: Array.from(participantIds) } },
    select: { userId: true, contestRating: true },
  });
  const ratingByUser = new Map(profiles.map((p) => [p.userId, p.contestRating]));
  const standingByUser = new Map(standings.map((s) => [s.userId, s]));

  const ratingParticipants = Array.from(participantIds).map((userId) => ({
    userId,
    rank: standingByUser.get(userId)?.rank ?? participantIds.size,
    rating: ratingByUser.get(userId) ?? DEFAULT_CONTEST_RATING,
  }));
  const ratingChanges = computeRatingChanges(ratingParticipants);

  await prisma.$transaction(async (tx) => {
    await tx.contestParticipant.deleteMany({ where: { contestId: contest.id } });
    for (const userId of Array.from(participantIds)) {
      const standing = standingByUser.get(userId);
      const change = ratingChanges.find((c) => c.userId === userId)!;
      const ratingBefore = ratingByUser.get(userId) ?? DEFAULT_CONTEST_RATING;
      await tx.contestParticipant.create({
        data: {
          contestId: contest.id,
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
      where: { id: contest.id },
      data: { status: ContestStatus.FINALIZED },
    });
  });

  const displayName = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m?.profile?.displayName ?? m?.name ?? id.slice(0, 8);
  };

  console.log(`Contest: /contests/${slug}\n`);
  console.log("Standings:");
  printTable(
    ["Rank", "Member", "Solved", "Penalty", "Δ rating", "New rating"],
    standings.map((s) => {
      const change = ratingChanges.find((c) => c.userId === s.userId)!;
      return [
        String(s.rank),
        displayName(s.userId),
        String(s.solvedCount),
        String(s.penalty),
        change.delta >= 0 ? `+${change.delta}` : String(change.delta),
        String(change.newRating),
      ];
    }),
  );

  const dnf = Array.from(participantIds).filter((id) => !standingByUser.has(id));
  if (dnf.length) {
    console.log("\nRegistered but no solves:");
    for (const userId of dnf) {
      const change = ratingChanges.find((c) => c.userId === userId)!;
      console.log(
        `  ${displayName(userId)}: rank ${participantIds.size}, Δ ${change.delta}, rating ${change.newRating}`,
      );
    }
  }

  const totalDelta = ratingChanges.reduce((sum, c) => sum + c.delta, 0);
  console.log(`\nTotal rating delta: ${totalDelta}`);
  console.log("\nView in app: /contests/" + slug);
  console.log("PASS: finalize flow completed.\n");
}

const useDb = process.argv.includes("--db");

if (useDb) {
  simulateDb()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      const { prisma } = await import("../lib/prisma");
      await prisma.$disconnect();
    });
} else {
  simulatePure();
}
