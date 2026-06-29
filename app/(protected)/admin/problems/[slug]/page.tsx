import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/guards";
import { prisma } from "../../../../../lib/prisma";
import RunSolution from "./run-solution";

const difficultyLabels = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export default async function AdminProblemDetailPage({
  params,
}: Readonly<{ params: { slug: string } }>) {
  await requireAdmin();
  const problem = await prisma.problem.findUnique({
    where: { slug: params.slug },
    include: {
      referenceSolutions: { orderBy: { language: "asc" } },
      testCases: { orderBy: { order: "asc" } },
    },
  });

  if (!problem) {
    notFound();
  }

  const referenceSolutions =
    problem.referenceSolutions.length > 0
      ? problem.referenceSolutions
      : problem.solutionCode
        ? [{ language: problem.solutionLanguage ?? "python", code: problem.solutionCode }]
        : [];

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Admin · {difficultyLabels[problem.difficulty]}</p>
        <h1>{problem.title}</h1>
        <div className="problem-statement">{problem.statement}</div>
        {problem.constraints ? (
          <div className="problem-section">
            <h2>Constraints</h2>
            <pre>{problem.constraints}</pre>
          </div>
        ) : null}

        <div className="problem-section">
          <h2>Reference solutions</h2>
          {referenceSolutions.length > 0 ? (
            <div className="sample-list">
              {referenceSolutions.map((solution) => (
                <article className="sample-card" key={solution.language}>
                  <h3>{solution.language}</h3>
                  <pre className="reference-solution">{solution.code}</pre>
                  <RunSolution language={solution.language} slug={problem.slug} />
                </article>
              ))}
            </div>
          ) : (
            <div className="form-message error">No reference solution stored.</div>
          )}
        </div>

        <div className="problem-section">
          <h2>Test cases ({problem.testCases.length})</h2>
          <div className="sample-list">
            {problem.testCases.map((testCase, index) => (
              <article className="sample-card" key={testCase.id}>
                <h3>
                  Test {index + 1} {testCase.isSample ? "(sample)" : "(hidden)"}
                </h3>
                <label>
                  Input
                  <pre>{testCase.input}</pre>
                </label>
                <label>
                  Expected output
                  <pre>{testCase.expectedOutput}</pre>
                </label>
              </article>
            ))}
          </div>
        </div>

        <div className="event-detail-actions">
          <a className="text-link" href="/admin/problems">
            Back to problems
          </a>
        </div>
      </section>
    </main>
  );
}
