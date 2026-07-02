import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import { supportedLanguageOptions } from "../../../lib/judge";
import { prisma } from "../../../lib/prisma";
import { SubmissionPanel } from "./submission-panel";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const difficultyLabels = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

function SubmissionGate({ userStatus }: Readonly<{ userStatus?: string }>) {
  if (!userStatus) {
    return (
      <a className="button" href="/join">
        Sign in to submit
      </a>
    );
  }

  if (userStatus !== "ACTIVE") {
    return (
      <a className="button" href="/apply">
        Finish application to submit
      </a>
    );
  }

  return null;
}

export default async function ProblemDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: { slug: string };
  searchParams?: { error?: string };
}>) {
  const session = await auth();
  const userId = session?.user?.id;
  const problem = await prisma.problem.findFirst({
    where: { slug: params.slug, published: true },
    select: {
      slug: true,
      title: true,
      statement: true,
      constraints: true,
      tags: true,
      difficulty: true,
      timeLimitMs: true,
      testCases: {
        where: { isSample: true },
        orderBy: { order: "asc" },
        select: { id: true, input: true, expectedOutput: true },
      },
      submissions: userId
        ? {
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              language: true,
              verdict: true,
              passedCount: true,
              totalCount: true,
              runtimeMs: true,
              failureMessage: true,
            },
          }
        : false,
    },
  });

  if (!problem) {
    notFound();
  }

  const canSubmit = session?.user?.status === "ACTIVE";
  const isAdmin = session?.user?.role === "ADMIN" && session.user.status === "ACTIVE";

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card practice-detail-card" data-lenis-prevent>
        <div className="practice-detail-header">
          <div>
            <p className="section-label">Practice problem</p>
            <h1>{problem.title}</h1>
            <div className="problem-tag-list">
              <span>{difficultyLabels[problem.difficulty]}</span>
              {problem.tags.length > 0
                ? problem.tags.map((tag) => <span key={tag}>{tag}</span>)
                : null}
            </div>
          </div>
          <div className="practice-detail-actions">
            {isAdmin ? (
              <a className="secondary-button" href={`/admin/problems/${problem.slug}`}>
                View reference solution
              </a>
            ) : null}
            <a className="text-link" href="/problems">
              Back to problems
            </a>
          </div>
        </div>

        <div className="practice-workspace">
          <section className="practice-prompt-pane problem-readonly" aria-label="Problem prompt">
            <div className="problem-statement">{problem.statement}</div>
            {problem.constraints ? (
              <div className="problem-section">
                <h2>Constraints</h2>
                <pre>{problem.constraints}</pre>
              </div>
            ) : null}

            <div className="problem-section">
              <h2>Sample tests</h2>
              <div className="sample-list">
                {problem.testCases.map((testCase, index) => (
                  <article className="sample-card" key={testCase.id}>
                    <h3>Sample {index + 1}</h3>
                    <label>
                      Input
                      <pre>{testCase.input}</pre>
                    </label>
                    <label>
                      Output
                      <pre>{testCase.expectedOutput}</pre>
                    </label>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="practice-submit-pane" aria-labelledby="submit-solution-heading">
            <div className="problem-section">
              <h2 id="submit-solution-heading">Submit solution</h2>
              {searchParams?.error === "rate-limit" ? (
                <div className="form-message error">
                  Daily submission limit reached. Try again tomorrow.
                </div>
              ) : null}
              <SubmissionGate userStatus={session?.user?.status} />
              {canSubmit ? (
                <SubmissionPanel
                  languageOptions={supportedLanguageOptions()}
                  problemSlug={problem.slug}
                  submissions={Array.isArray(problem.submissions) ? problem.submissions : []}
                />
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
