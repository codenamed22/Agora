import { requireAdmin } from "../../../../lib/guards";
import { prisma } from "../../../../lib/prisma";

const difficultyLabels = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export default async function AdminProblemsPage() {
  await requireAdmin();
  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      slug: true,
      title: true,
      difficulty: true,
      solutionCode: true,
      _count: { select: { testCases: true } },
    },
  });

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin</p>
        <h1>Practice problems</h1>
        <p>Review each problem&apos;s test cases and run its reference solution against them.</p>

        <div className="member-badge-admin-list">
          {problems.map((problem) => (
            <article className="member-badge-admin-row" key={problem.slug}>
              <div>
                <strong>{problem.title}</strong>
                <small>
                  {difficultyLabels[problem.difficulty]} · {problem._count.testCases} tests ·{" "}
                  {problem.solutionCode ? "solution ready" : "no solution"}
                </small>
              </div>
              <a className="secondary-button" href={`/admin/problems/${problem.slug}`}>
                View
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
