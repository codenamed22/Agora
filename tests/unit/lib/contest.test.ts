import { ContestStatus, SubmissionVerdict } from "@/prisma-client";
import { describe, expect, it } from "vitest";
import {
  computeRatingChanges,
  computeStandings,
  contestPhase,
  contestWindowForUser,
  DEFAULT_CONTEST_RATING,
  personalContestStart,
  tierForRating,
} from "../../../lib/contest";

const startsAt = new Date("2026-07-01T10:00:00.000Z");

function submission(
  userId: string,
  contestProblemId: string,
  verdict: SubmissionVerdict,
  createdAt: Date,
) {
  return { userId, contestProblemId, verdict, createdAt };
}

describe("computeStandings", () => {
  it("ranks by solved count then penalty", () => {
    const standings = computeStandings(
      [
        submission(
          "alice",
          "p1",
          SubmissionVerdict.WRONG_ANSWER,
          new Date("2026-07-01T10:05:00.000Z"),
        ),
        submission("alice", "p1", SubmissionVerdict.ACCEPTED, new Date("2026-07-01T10:20:00.000Z")),
        submission("bob", "p1", SubmissionVerdict.ACCEPTED, new Date("2026-07-01T10:10:00.000Z")),
      ],
      startsAt,
    );

    expect(standings).toEqual([
      expect.objectContaining({ userId: "bob", solvedCount: 1, penalty: 10, rank: 1 }),
      expect.objectContaining({ userId: "alice", solvedCount: 1, penalty: 25, rank: 2 }),
    ]);
  });

  it("ignores users with no accepted submissions", () => {
    const standings = computeStandings(
      [
        submission(
          "alice",
          "p1",
          SubmissionVerdict.WRONG_ANSWER,
          new Date("2026-07-01T10:05:00.000Z"),
        ),
      ],
      startsAt,
    );

    expect(standings).toEqual([]);
  });

  it("uses participant start times for demo contest penalties", () => {
    const standings = computeStandings(
      [
        submission("alice", "p1", SubmissionVerdict.ACCEPTED, new Date("2026-07-01T10:20:00.000Z")),
        submission("bob", "p1", SubmissionVerdict.ACCEPTED, new Date("2026-07-01T11:10:00.000Z")),
      ],
      startsAt,
      new Map([
        ["alice", new Date("2026-07-01T10:00:00.000Z")],
        ["bob", new Date("2026-07-01T11:00:00.000Z")],
      ]),
    );

    expect(standings).toEqual([
      expect.objectContaining({ userId: "bob", solvedCount: 1, penalty: 10, rank: 1 }),
      expect.objectContaining({ userId: "alice", solvedCount: 1, penalty: 20, rank: 2 }),
    ]);
  });
});

describe("computeRatingChanges", () => {
  it("raises top ranks and keeps total drift at zero", () => {
    const changes = computeRatingChanges([
      { userId: "alice", rank: 1, rating: DEFAULT_CONTEST_RATING },
      { userId: "bob", rank: 2, rating: DEFAULT_CONTEST_RATING },
      { userId: "cara", rank: 3, rating: DEFAULT_CONTEST_RATING },
    ]);

    const deltaByUser = new Map(changes.map((change) => [change.userId, change.delta]));

    expect(deltaByUser.get("alice")).toBeGreaterThan(deltaByUser.get("bob")!);
    expect(deltaByUser.get("bob")).toBeGreaterThan(deltaByUser.get("cara")!);
    expect(changes.reduce((sum, change) => sum + change.delta, 0)).toBe(0);
  });
});

describe("tierForRating", () => {
  it("maps ratings to contest tiers", () => {
    expect(tierForRating(1000).name).toBe("Rough Shard");
    expect(tierForRating(1150).name).toBe("Cut Shard");
    expect(tierForRating(1300).name).toBe("Polished Shard");
    expect(tierForRating(1500).name).toBe("Radiant Shard");
    expect(tierForRating(1700).name).toBe("Molten Shard");
  });

  it("exposes a short label and color for each tier", () => {
    expect(tierForRating(1000).label).toBe("Rough");
    expect(tierForRating(1000).color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("contestPhase", () => {
  it("derives upcoming, open, and finished phases from the contest window", () => {
    const contest = {
      status: ContestStatus.PUBLISHED,
      startsAt: new Date("2026-07-01T10:00:00.000Z"),
      endsAt: new Date("2026-07-01T12:00:00.000Z"),
    };

    expect(contestPhase(contest, new Date("2026-07-01T09:00:00.000Z"))).toBe("upcoming");
    expect(contestPhase(contest, new Date("2026-07-01T11:00:00.000Z"))).toBe("running");
    expect(contestPhase(contest, new Date("2026-07-01T13:00:00.000Z"))).toBe("finished");
  });

  it("uses each member's start time as their personal running window", () => {
    const contest = {
      status: ContestStatus.PUBLISHED,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2099-12-31T23:59:59.000Z"),
      durationMinutes: 60,
    };
    const registeredAt = new Date("2026-07-01T10:00:00.000Z");

    expect(contestPhase(contest, new Date("2026-07-01T10:30:00.000Z"), registeredAt)).toBe(
      "running",
    );
    expect(contestPhase(contest, new Date("2026-07-01T11:01:00.000Z"), registeredAt)).toBe(
      "finished",
    );
  });

  it("starts the timer at the contest open for members who register early", () => {
    const contest = {
      status: ContestStatus.PUBLISHED,
      startsAt: new Date("2026-07-01T10:00:00.000Z"),
      endsAt: new Date("2026-07-01T11:00:00.000Z"),
      durationMinutes: 60,
    };
    // Registered a day early — the personal timer must not begin before startsAt.
    const registeredAt = new Date("2026-06-30T09:00:00.000Z");

    expect(contestPhase(contest, new Date("2026-07-01T09:59:00.000Z"), registeredAt)).toBe(
      "upcoming",
    );
    expect(contestPhase(contest, new Date("2026-07-01T10:30:00.000Z"), registeredAt)).toBe(
      "running",
    );
    expect(contestPhase(contest, new Date("2026-07-01T11:01:00.000Z"), registeredAt)).toBe(
      "finished",
    );
  });
});

describe("personalContestStart", () => {
  const contest = {
    status: ContestStatus.PUBLISHED,
    startsAt: new Date("2026-07-01T10:00:00.000Z"),
    endsAt: new Date("2026-07-01T11:00:00.000Z"),
    durationMinutes: 60,
  };

  it("clamps early registrations to the contest open time", () => {
    const registeredAt = new Date("2026-06-30T09:00:00.000Z");

    expect(personalContestStart(contest, registeredAt)).toEqual(contest.startsAt);
    expect(contestWindowForUser(contest, registeredAt)).toEqual({
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
    });
  });

  it("uses the join time for members who register mid-window", () => {
    const registeredAt = new Date("2026-07-01T10:20:00.000Z");

    expect(personalContestStart(contest, registeredAt)).toEqual(registeredAt);
    expect(contestWindowForUser(contest, registeredAt)).toEqual({
      startsAt: registeredAt,
      endsAt: contest.endsAt,
    });
  });
});
