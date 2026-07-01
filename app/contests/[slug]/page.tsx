import { UserStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import {
  computeStandings,
  contestPhase,
  contestWindowForUser,
  formatContestTiming,
  formatContestWindow,
  standingsWithNames,
} from "../../../lib/contest";
import { prisma } from "../../../lib/prisma";
import { registerForContest } from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function ContestDetailPage({
  params,
  searchParams,
}: Readonly<{ params: { slug: string }; searchParams?: { error?: string } }>) {
  const session = await auth();
  const contest = await prisma.contest.findFirst({
    where: { slug: params.slug, status: { not: "DRAFT" } },
    include: {
      problems: {
        orderBy: { order: "asc" },
        include: { problem: { select: { title: true, difficulty: true } } },
      },
      registrations: { select: { id: true, userId: true, createdAt: true } },
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

  if (!contest) {
    notFound();
  }

  const currentRegistration = contest.registrations.find(
    (registration) => registration.userId === session?.user?.id,
  );
  const phase = contestPhase(contest, new Date(), currentRegistration?.createdAt);
  const isRegistered = Boolean(currentRegistration);
  const userWindow = currentRegistration
    ? contestWindowForUser(contest, currentRegistration.createdAt)
    : null;
  const startTimesByUser = new Map(
    contest.registrations.map((registration) => [registration.userId, registration.createdAt]),
  );
  const standings = standingsWithNames(
    computeStandings(contest.submissions, contest.startsAt, startTimesByUser),
    await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(new Set(contest.submissions.map((submission) => submission.userId))),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: { select: { displayName: true } },
      },
    }),
  );

  const canStart =
    session?.user?.status === UserStatus.ACTIVE &&
    (phase === "upcoming" || phase === "running") &&
    !isRegistered;
  const canViewProblems = isRegistered && phase === "running";

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Contest</p>
        <h1>{contest.title}</h1>
        <p>{contest.description}</p>
        <p className="nudge-meta">
          {formatContestTiming(contest)} · Status: {phase}
        </p>
        {userWindow ? (
          <p className="nudge-meta">
            Your window: {formatContestWindow(userWindow.startsAt, userWindow.endsAt)}
          </p>
        ) : null}

        {searchParams?.error === "register" ? (
          <div className="form-message error">Start this contest before solving problems.</div>
        ) : null}

        {canStart ? (
          <form action={registerForContest} className="inline-form">
            <input type="hidden" name="contestSlug" value={contest.slug} />
            <button className="button" type="submit">
              Start contest
            </button>
          </form>
        ) : null}

        {canViewProblems ? (
          <section className="nudge-section">
            <h2>Problems</h2>
            <div className="event-list">
              {contest.problems.map((contestProblem) => (
                <article className="event-card" key={contestProblem.id}>
                  <div>
                    <h3>
                      <a href={`/contests/${contest.slug}/problems/${contestProblem.label}`}>
                        {contestProblem.label}. {contestProblem.problem.title}
                      </a>
                    </h3>
                    <p className="nudge-meta">{contestProblem.problem.difficulty}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="practice-leaderboard" aria-labelledby="contest-standings-title">
          <div className="practice-leaderboard-header">
            <h2 id="contest-standings-title">Standings</h2>
            <span>Solved · Penalty</span>
          </div>
          {standings.length > 0 ? (
            <div className="leaderboard-list">
              {standings.map((entry) => (
                <div className="leaderboard-row" key={entry.userId}>
                  <span className="leaderboard-rank">#{entry.rank}</span>
                  <span className="leaderboard-name">{entry.name}</span>
                  <span className="leaderboard-score">
                    {entry.solvedCount} · {entry.penalty}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="form-message">No accepted submissions yet.</div>
          )}
        </section>
      </section>
    </main>
  );
}
