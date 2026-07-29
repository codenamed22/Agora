import { UserStatus } from "@/prisma-client";
import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import {
  computeStandings,
  contestDurationMinutes,
  contestPhase,
  contestWindowForUser,
  formatContestInstant,
  formatContestTiming,
  formatContestWindow,
  personalContestStart,
  standingsWithNames,
} from "../../../lib/contest";
import { prisma } from "../../../lib/prisma";
import ContestRegistrationControl from "../registration-control";

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
        include: { problem: { select: { title: true, difficulty: true, slug: true } } },
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
      _count: { select: { registrations: true } },
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
    contest.registrations.map((registration) => [
      registration.userId,
      personalContestStart(contest, registration.createdAt),
    ]),
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

  const canViewProblems = isRegistered && phase === "running";
  const isAdmin = session?.user?.role === "ADMIN" && session.user.status === UserStatus.ACTIVE;

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
          <div className="form-message error">
            Register for this contest before solving problems.
          </div>
        ) : null}

        {phase === "upcoming" ? (
          <div className="form-message">
            This contest hasn&apos;t started yet. It opens {formatContestInstant(contest.startsAt)}.
            Register now and your {contestDurationMinutes(contest)}-minute timer starts
            automatically when it opens.
          </div>
        ) : null}

        {phase === "upcoming" || phase === "running" ? (
          <>
            <p className="nudge-meta">{contest._count.registrations} registered</p>
            <ContestRegistrationControl
              contestSlug={contest.slug}
              userStatus={session?.user?.status}
              isRegistered={isRegistered}
              phase={phase}
            />
          </>
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

        {isAdmin ? (
          <section className="nudge-section">
            <h2>Test contest (admin)</h2>
            <p className="nudge-meta">
              Enter the live problem view without registering, run the reference solutions against
              every test case, and confirm everything works before the contest opens. Preview does
              not create submissions or affect standings.
            </p>
            {contest.problems.length > 0 ? (
              <p>
                <a
                  className="button"
                  href={`/contests/${contest.slug}/problems/${contest.problems[0].label}?preview=1`}
                >
                  Test contest
                </a>
              </p>
            ) : null}
            <div className="event-list">
              {contest.problems.map((contestProblem) => (
                <article className="event-card" key={`admin-${contestProblem.id}`}>
                  <div>
                    <strong>
                      {contestProblem.label}. {contestProblem.problem.title}
                    </strong>
                    <p className="nudge-meta">{contestProblem.problem.difficulty}</p>
                  </div>
                  <div className="event-actions">
                    <a
                      className="secondary-button"
                      href={`/contests/${contest.slug}/problems/${contestProblem.label}?preview=1`}
                    >
                      Open in preview
                    </a>
                    <a
                      className="text-link"
                      href={`/admin/problems/${contestProblem.problem.slug}`}
                    >
                      Reference solutions
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="practice-leaderboard" aria-labelledby="contest-standings-title">
          <div className="practice-leaderboard-header">
            <h2 id="contest-standings-title">Standings</h2>
            <span>Solved · Time taken</span>
          </div>
          {standings.length > 0 ? (
            <div className="leaderboard-list">
              {standings.map((entry) => (
                <div className="leaderboard-row" key={entry.userId}>
                  <span className="leaderboard-rank">#{entry.rank}</span>
                  <span className="leaderboard-name">{entry.name}</span>
                  <span className="leaderboard-score">
                    {entry.solvedCount} · {entry.penalty} min
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
