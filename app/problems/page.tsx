import { SubmissionVerdict } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

const difficultyLabels = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export default async function ProblemsPage() {
  const problems = await prisma.problem.findMany({
    where: { published: true },
    orderBy: [{ difficulty: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      tags: true,
      difficulty: true,
    },
  });
  const acceptedSubmissions = await prisma.submission.findMany({
    where: {
      verdict: SubmissionVerdict.ACCEPTED,
      problemId: { in: problems.map((problem) => problem.id) },
    },
    distinct: ["problemId", "userId"],
    select: { problemId: true, userId: true },
  });
  const acceptedCounts = acceptedSubmissions.reduce<Record<string, number>>(
    (counts, submission) => {
      counts[submission.problemId] = (counts[submission.problemId] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const solvedCounts = acceptedSubmissions.reduce<Record<string, number>>((counts, submission) => {
    counts[submission.userId] = (counts[submission.userId] ?? 0) + 1;
    return counts;
  }, {});
  const users = await prisma.user.findMany({
    where: { id: { in: Object.keys(solvedCounts) } },
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { displayName: true } },
    },
  });
  const userById = new Map(users.map((user) => [user.id, user]));
  const leaderboard = Object.entries(solvedCounts)
    .map(([userId, solvedCount]) => {
      const user = userById.get(userId);
      return {
        userId,
        solvedCount,
        name: user?.profile?.displayName ?? user?.name ?? "ShardUp member",
      };
    })
    .sort(
      (left, right) => right.solvedCount - left.solvedCount || left.name.localeCompare(right.name),
    )
    .slice(0, 10);

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <p className="section-label">Practice</p>
        <h1>ShardUp DSA Practice Sheet</h1>

        <section className="practice-leaderboard" aria-labelledby="practice-leaderboard-title">
          <div className="practice-leaderboard-header">
            <h2 id="practice-leaderboard-title">Leaderboard</h2>
            <span>Problems solved</span>
          </div>
          {leaderboard.length > 0 ? (
            <div className="leaderboard-list">
              {leaderboard.map((entry, index) => (
                <div className="leaderboard-row" key={entry.userId}>
                  <span className="leaderboard-rank">#{index + 1}</span>
                  <span className="leaderboard-name">{entry.name}</span>
                  <span className="leaderboard-score">{entry.solvedCount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="form-message">No accepted solutions yet.</div>
          )}
        </section>

        <div className="problem-list">
          {problems.length > 0 ? (
            problems.map((problem) => (
              <a className="problem-row" href={`/problems/${problem.slug}`} key={problem.slug}>
                <span className="problem-row-title">{problem.title}</span>
                <div className="problem-row-meta">
                  <span className={`difficulty-pill ${problem.difficulty.toLowerCase()}`}>
                    {difficultyLabels[problem.difficulty]}
                  </span>
                  {problem.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                  <span>{acceptedCounts[problem.id] ?? 0} accepted</span>
                </div>
              </a>
            ))
          ) : (
            <div className="form-message">No practice problems are published yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
