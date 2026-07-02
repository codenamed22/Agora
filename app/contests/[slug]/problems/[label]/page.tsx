import { UserStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { ProblemWorkspace } from "../../../../../components/practice/problem-workspace";
import {
  contestPhase,
  contestWindowForUser,
  formatContestWindow,
  isContestLive,
} from "../../../../../lib/contest";
import { supportedLanguageOptions } from "../../../../../lib/judge";
import { prisma } from "../../../../../lib/prisma";
import { runContestPreview, submitContestSolution } from "../../actions";

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

export default async function ContestProblemPage({
  params,
  searchParams,
}: Readonly<{
  params: { slug: string; label: string };
  searchParams?: { error?: string; preview?: string };
}>) {
  const session = await auth();
  const contest = await prisma.contest.findFirst({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      startsAt: true,
      endsAt: true,
      status: true,
      durationMinutes: true,
    },
  });

  if (!contest) {
    redirect(`/contests/${params.slug}`);
  }

  if (!session?.user || session.user.status !== UserStatus.ACTIVE) {
    redirect("/join");
  }

  const isAdmin = session.user.role === "ADMIN";
  const previewMode = isAdmin && searchParams?.preview === "1";

  const registration = await prisma.contestRegistration.findUnique({
    where: { contestId_userId: { contestId: contest.id, userId: session.user.id } },
    select: { id: true, createdAt: true },
  });

  // Admins in preview mode can inspect a contest problem outside the live window
  // without registering; everyone else must have started the contest.
  if (!previewMode) {
    if (!registration) {
      redirect(`/contests/${contest.slug}?error=register`);
    }

    if (!isContestLive(contest, new Date(), registration.createdAt)) {
      redirect(`/contests/${contest.slug}`);
    }
  }

  const contestProblem = await prisma.contestProblem.findFirst({
    where: { contestId: contest.id, label: params.label.toUpperCase() },
    include: {
      problem: {
        include: {
          testCases: {
            where: { isSample: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!contestProblem) {
    notFound();
  }

  const submissions = await prisma.contestSubmission.findMany({
    where: {
      contestId: contest.id,
      contestProblemId: contestProblem.id,
      userId: session.user.id,
    },
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
  });

  const previewData = previewMode
    ? await prisma.problem.findUnique({
        where: { id: contestProblem.problemId },
        select: {
          solutionCode: true,
          solutionLanguage: true,
          referenceSolutions: {
            orderBy: { language: "asc" },
            select: { language: true, code: true },
          },
          _count: { select: { testCases: true } },
        },
      })
    : null;
  const initialCodeByLanguage: Record<string, string> = {};
  if (previewData) {
    for (const reference of previewData.referenceSolutions) {
      initialCodeByLanguage[reference.language] = reference.code;
    }
    if (previewData.referenceSolutions.length === 0 && previewData.solutionCode) {
      initialCodeByLanguage[previewData.solutionLanguage ?? "python"] = previewData.solutionCode;
    }
  }

  const window = registration ? contestWindowForUser(contest, registration.createdAt) : null;

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card practice-detail-card" data-lenis-prevent>
        <div className="practice-detail-header">
          <div className="practice-detail-heading">
            <h1>
              {contestProblem.label}. {contestProblem.problem.title}
            </h1>
            <span
              className={`difficulty-badge ${difficultyClasses[contestProblem.problem.difficulty]}`}
            >
              {difficultyLabels[contestProblem.problem.difficulty]}
            </span>
            {contestProblem.problem.tags.length > 0 ? (
              <div className="problem-tag-list">
                {contestProblem.problem.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="practice-detail-actions">
            <a className="text-link" href={`/contests/${contest.slug}`}>
              Back to contest
            </a>
          </div>
        </div>

        <div className="practice-contest-meta">
          <a href={`/contests/${contest.slug}`}>{contest.title}</a>
          <span>
            {contestPhase(contest, new Date(), registration?.createdAt)}
            {previewMode ? " · admin preview" : ""}
          </span>
          {window ? (
            <span>Your window: {formatContestWindow(window.startsAt, window.endsAt)}</span>
          ) : null}
        </div>

        {previewMode ? (
          <div className="form-message">
            Admin preview — this is the exact workspace participants see, preloaded with the stored
            reference solution. Hitting run executes against all{" "}
            {previewData?._count.testCases ?? 0} test cases (samples, hidden, and efficiency) via the
            real judge. Runs here are ephemeral: nothing is stored and standings are unaffected.{" "}
            <a className="text-link" href={`/admin/problems/${contestProblem.problem.slug}`}>
              View full reference solutions & test cases
            </a>
          </div>
        ) : null}

        <ProblemWorkspace
          statement={contestProblem.problem.statement}
          constraints={contestProblem.problem.constraints}
          samples={contestProblem.problem.testCases}
          languageOptions={supportedLanguageOptions()}
          submissions={previewMode ? [] : submissions}
          submitAction={previewMode ? runContestPreview : submitContestSolution}
          hiddenFields={
            previewMode
              ? { problemSlug: contestProblem.problem.slug }
              : { contestSlug: contest.slug, problemLabel: contestProblem.label }
          }
          draftScope={
            previewMode
              ? `contest-preview:${contest.slug}:${contestProblem.label}`
              : `contest:${contest.slug}:${contestProblem.label}`
          }
          canSubmit
          initialCodeByLanguage={previewMode ? initialCodeByLanguage : undefined}
          rateLimited={!previewMode && searchParams?.error === "rate-limit"}
          rateLimitMessage="You have reached the daily submission limit."
        />
      </section>
    </main>
  );
}
