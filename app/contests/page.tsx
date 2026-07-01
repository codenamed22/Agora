import { ContestStatus } from "@prisma/client";
import { contestPhase, formatContestTiming } from "../../lib/contest";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContestsPage() {
  const now = new Date();
  const contests = await prisma.contest.findMany({
    where: { status: { in: [ContestStatus.PUBLISHED, ContestStatus.FINALIZED] } },
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { registrations: true, problems: true } } },
  });

  const groups = {
    running: contests.filter((contest) => contestPhase(contest, now) === "running"),
    upcoming: contests.filter((contest) => contestPhase(contest, now) === "upcoming"),
    past: contests.filter((contest) => {
      const phase = contestPhase(contest, now);
      return phase === "finished" || phase === "finalized";
    }),
  };

  function renderSection(title: string, items: typeof contests) {
    return (
      <section className="nudge-section">
        <h2>{title}</h2>
        <div className="event-list">
          {items.length > 0 ? (
            items.map((contest) => (
              <article className="event-card" key={contest.id}>
                <div>
                  <h3>
                    <a href={`/contests/${contest.slug}`}>{contest.title}</a>
                  </h3>
                  <p className="nudge-meta">
                    {formatContestTiming(contest)} · {contest._count.registrations} registered
                  </p>
                  <p>{contest.description}</p>
                </div>
                <div className="event-actions">
                  <a className="button" href={`/contests/${contest.slug}`}>
                    View contest
                  </a>
                </div>
              </article>
            ))
          ) : (
            <div className="form-message">No contests in this section yet.</div>
          )}
        </div>
      </section>
    );
  }

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Contests</p>
        <h1>ShardUp coding contests</h1>
        <p>
          Self-timed contests: start whenever you are ready, solve the problems within your personal
          timer, and climb the contest rating ladder.
        </p>

        {renderSection("Open now", groups.running)}
        {renderSection("Upcoming", groups.upcoming)}
        {renderSection("Past", groups.past)}
      </section>
    </main>
  );
}
