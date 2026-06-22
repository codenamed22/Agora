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
      _count: { select: { submissions: true } },
    },
  });

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <p className="section-label">Practice</p>
        <h1>ShardUp DSA Practice Sheet</h1>

        <div className="problem-list">
          {problems.length > 0 ? (
            problems.map((problem) => (
              <a className="problem-row" href={`/problems/${problem.slug}`} key={problem.id}>
                <span className="problem-row-title">{problem.title}</span>
                <div className="problem-row-meta">
                  <span className={`difficulty-pill ${problem.difficulty.toLowerCase()}`}>
                    {difficultyLabels[problem.difficulty]}
                  </span>
                  {problem.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                  <span>{problem._count.submissions} submissions</span>
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
