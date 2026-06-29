import { SubmissionVerdict } from "@prisma/client";
import { auth } from "../../auth";
import { rankPracticeUsers } from "../../lib/practice";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

const difficultyLabels = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

const WARMUP_PROBLEM_SLUG = "sum-two-numbers";

export default async function ProblemsPage() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const problems = await prisma.problem.findMany({
    where: { published: true },
    orderBy: [{ practiceOrder: "asc" }, { difficulty: "asc" }, { title: "asc" }],
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
  const difficultyByProblemId = new Map(
    problems.map((problem) => [problem.id, problem.difficulty]),
  );
  const rankedSubmissions = acceptedSubmissions.map((submission) => ({
    ...submission,
    difficulty: difficultyByProblemId.get(submission.problemId)!,
  }));
  const solvedProblemIds = new Set(
    currentUserId
      ? acceptedSubmissions.filter((s) => s.userId === currentUserId).map((s) => s.problemId)
      : [],
  );

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
  const leaderboard = rankPracticeUsers(rankedSubmissions, users).slice(0, 10);
  const warmupProblem = problems.find((problem) => problem.slug === WARMUP_PROBLEM_SLUG);
  const sheetProblems = [
    ...(warmupProblem ? [warmupProblem] : []),
    ...problems.filter((problem) => problem.slug !== WARMUP_PROBLEM_SLUG),
  ];

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Practice</p>
        <h1>ShardUp DSA Practice Sheet</h1>

        <section className="practice-leaderboard" aria-labelledby="practice-leaderboard-title">
          <div className="practice-leaderboard-header">
            <h2 id="practice-leaderboard-title">Leaderboard</h2>
            <span>Score</span>
          </div>
          {leaderboard.length > 0 ? (
            <div className="leaderboard-list">
              {leaderboard.map((entry, index) => (
                <div className="leaderboard-row" key={entry.userId}>
                  <span className="leaderboard-rank">#{index + 1}</span>
                  <span className="leaderboard-name">{entry.name}</span>
                  <span className="leaderboard-score">{entry.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="form-message">No accepted solutions yet.</div>
          )}
        </section>

        <div className="problem-list">
          {sheetProblems.length > 0 ? (
            sheetProblems.map((problem) => (
              <a
                className={[
                  "problem-row",
                  problem.slug === WARMUP_PROBLEM_SLUG && "pinned-problem",
                  solvedProblemIds.has(problem.id) && "solved",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={`/problems/${problem.slug}`}
                key={problem.slug}
              >
                <span className="problem-row-title">
                  {problem.slug === WARMUP_PROBLEM_SLUG ? (
                    <span aria-label="Pinned">📌</span>
                  ) : null}
                  {problem.title}
                </span>
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
