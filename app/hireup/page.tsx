import { ContestStatus } from "@/prisma-client";
import { contestPhase, formatContestTiming } from "../../lib/contest";
import { requireActiveUser } from "../../lib/guards";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

// HireUp rounds are modelled as contests whose slug begins with this prefix, so
// future rounds can be added without a schema change.
const HIREUP_ROUND_PREFIX = "hireup-";

const phaseLabels: Record<string, string> = {
  running: "Open now",
  upcoming: "Upcoming",
  finished: "Finished",
  finalized: "Finished",
};

export default async function HireUpPage() {
  // HireUp is members-only: redirects guests to /join and non-active users to
  // /apply.
  await requireActiveUser();

  const now = new Date();
  const rounds = await prisma.contest.findMany({
    where: {
      slug: { startsWith: HIREUP_ROUND_PREFIX },
      status: { in: [ContestStatus.PUBLISHED, ContestStatus.FINALIZED] },
    },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { registrations: true, problems: true } } },
  });

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">HireUp</p>
        <h1>HireUp mock hiring</h1>
        <p>
          HireUp is ShardUp&apos;s month-long mock-hiring drive. Take it round by round, starting
          with an online assessment, and treat every stage like the real thing.
        </p>

        <section className="nudge-section">
          <h2>Rounds</h2>
          <div className="event-list">
            {rounds.length > 0 ? (
              rounds.map((round, index) => (
                <article className="event-card" key={round.id}>
                  <div>
                    <h3>
                      <a href={`/contests/${round.slug}`}>
                        Round {index + 1}: {round.title}
                      </a>
                    </h3>
                    <p className="nudge-meta">
                      {phaseLabels[contestPhase(round, now)] ?? "Upcoming"} ·{" "}
                      {formatContestTiming(round)} · {round._count.registrations} registered
                    </p>
                    <p>{round.description}</p>
                  </div>
                  <div className="event-actions">
                    <a className="button" href={`/contests/${round.slug}`}>
                      Go to round
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="form-message">No HireUp rounds are open yet. Check back soon.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
