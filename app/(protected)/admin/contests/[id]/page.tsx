import { ContestStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { contestPhase, formatContestTiming, toContestInputValue } from "../../../../../lib/contest";
import { requireAdmin } from "../../../../../lib/guards";
import { prisma } from "../../../../../lib/prisma";
import {
  addContestProblem,
  finalizeContest,
  publishContest,
  removeContestProblem,
} from "../actions";

export default async function AdminContestDetailPage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams?: { error?: string } }>) {
  await requireAdmin();

  const contest = await prisma.contest.findUnique({
    where: { id: params.id },
    include: {
      problems: {
        orderBy: { order: "asc" },
        include: { problem: { select: { title: true, slug: true, published: true } } },
      },
    },
  });

  if (!contest) {
    notFound();
  }

  const availableProblems = await prisma.problem.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true, published: true },
  });

  const phase = contestPhase(contest);
  const canPublish = contest.status === ContestStatus.DRAFT && contest.problems.length > 0;
  const canFinalize = contest.status === ContestStatus.PUBLISHED && phase === "finished";

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>{contest.title}</h1>
        <p>{contest.description}</p>
        <p className="nudge-meta">
          {formatContestTiming(contest)} · {contest.status} · {phase}
        </p>

        {searchParams?.error === "problems" ? (
          <div className="form-message error">Add at least one problem before publishing.</div>
        ) : null}
        {searchParams?.error === "not-ended" ? (
          <div className="form-message error">Wait until the contest ends before finalizing.</div>
        ) : null}

        <div className="auth-actions-list">
          {canPublish ? (
            <form action={publishContest} className="inline-form">
              <input type="hidden" name="contestId" value={contest.id} />
              <button className="button" type="submit">
                Publish contest
              </button>
            </form>
          ) : null}
          {canFinalize ? (
            <form action={finalizeContest} className="inline-form">
              <input type="hidden" name="contestId" value={contest.id} />
              <button className="secondary-button" type="submit">
                Finalize ratings
              </button>
            </form>
          ) : null}
          {contest.status !== ContestStatus.DRAFT ? (
            <a className="text-link" href={`/contests/${contest.slug}`}>
              View public page
            </a>
          ) : null}
        </div>

        <section className="nudge-section">
          <h2>Contest problems</h2>
          <div className="event-list">
            {contest.problems.map((contestProblem) => (
              <article className="event-card" key={contestProblem.id}>
                <div>
                  <strong>
                    {contestProblem.label}. {contestProblem.problem.title}
                  </strong>
                  <p className="nudge-meta">{contestProblem.problem.slug}</p>
                </div>
                <form action={removeContestProblem} className="inline-form">
                  <input type="hidden" name="contestId" value={contest.id} />
                  <input type="hidden" name="contestProblemId" value={contestProblem.id} />
                  <button className="secondary-button" type="submit">
                    Remove
                  </button>
                </form>
              </article>
            ))}
          </div>

          {contest.status === ContestStatus.DRAFT && availableProblems.length > 0 ? (
            <form action={addContestProblem} className="stacked-form member-badge-form">
              <input type="hidden" name="contestId" value={contest.id} />
              <label htmlFor="problemId">Add problem</label>
              <select id="problemId" name="problemId" required>
                {availableProblems.map((problem) => (
                  <option key={problem.id} value={problem.id}>
                    {problem.title}
                    {problem.published ? " (practice)" : " (unpublished)"}
                  </option>
                ))}
              </select>
              <label htmlFor="label">Label</label>
              <input id="label" name="label" placeholder="A" required />
              <label htmlFor="order">Order</label>
              <input id="order" name="order" type="number" defaultValue={contest.problems.length} />
              <button className="secondary-button" type="submit">
                Add problem
              </button>
            </form>
          ) : null}
        </section>

        <section className="nudge-section">
          <h2>Schedule (IST)</h2>
          <p className="nudge-meta">
            Starts {toContestInputValue(contest.startsAt)} · Ends{" "}
            {toContestInputValue(contest.endsAt)}
          </p>
        </section>
      </section>
    </main>
  );
}
