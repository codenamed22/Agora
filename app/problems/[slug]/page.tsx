import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import { ProblemWorkspace } from "../../../components/practice/problem-workspace";
import { supportedLanguageOptions } from "../../../lib/judge";
import { prisma } from "../../../lib/prisma";
import { submitSolution } from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const difficultyLabels = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

const difficultyClasses = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

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
          <div className="practice-detail-heading">
            <h1>{problem.title}</h1>
            <span className={`difficulty-badge ${difficultyClasses[problem.difficulty]}`}>
              {difficultyLabels[problem.difficulty]}
            </span>
            {problem.tags.length > 0 ? (
              <div className="problem-tag-list">
                {problem.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
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

        <ProblemWorkspace
          statement={problem.statement}
          constraints={problem.constraints}
          samples={problem.testCases}
          languageOptions={supportedLanguageOptions()}
          submissions={Array.isArray(problem.submissions) ? problem.submissions : []}
          submitAction={submitSolution}
          hiddenFields={{ problemSlug: problem.slug }}
          draftScope={problem.slug}
          canSubmit={canSubmit}
          userStatus={session?.user?.status}
          rateLimited={searchParams?.error === "rate-limit"}
        />
      </section>
    </main>
  );
}
