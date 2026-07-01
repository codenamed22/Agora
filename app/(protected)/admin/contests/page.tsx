import { formatContestTiming } from "../../../../lib/contest";
import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";
import CreateContestModal from "../../../create-contest-modal";

export default async function AdminContestsPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  await requireAdmin();
  const contests = await prisma.contest.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { problems: true, registrations: true } } },
  });

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Contests</h1>
        <p>Create contests, attach unpublished problems, publish, and finalize ratings.</p>
        {searchParams?.error ? (
          <div className="form-message error">Check the contest fields.</div>
        ) : null}

        <a className="button" href="#create-contest">
          Create contest
        </a>
        <CreateContestModal error={searchParams?.error} returnTo="/admin/contests" />

        <div className="member-badge-admin-list">
          {contests.map((contest) => (
            <article className="member-badge-admin-row" key={contest.id}>
              <div>
                <strong>{contest.title}</strong>
                <small>
                  {formatContestTiming(contest)} · {contest.status} · {contest._count.problems}{" "}
                  problems · {contest._count.registrations} registered
                </small>
              </div>
              <a className="secondary-button" href={`/admin/contests/${contest.id}`}>
                Manage
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
