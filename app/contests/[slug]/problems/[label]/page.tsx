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
import { submitContestSolution } from "../../actions";

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
  searchParams?: { error?: string };
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

  const registration = await prisma.contestRegistration.findUnique({
    where: { contestId_userId: { contestId: contest.id, userId: session.user.id } },
    select: { id: true, createdAt: true },
  });

  if (!registration) {
    redirect(`/contests/${contest.slug}?error=register`);
  }

  if (!isContestLive(contest, new Date(), registration.createdAt)) {
    redirect(`/contests/${contest.slug}`);
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

  const window = contestWindowForUser(contest, registration.createdAt);

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
          <span>{contestPhase(contest, new Date(), registration.createdAt)}</span>
          <span>Your window: {formatContestWindow(window.startsAt, window.endsAt)}</span>
        </div>

        <ProblemWorkspace
          statement={contestProblem.problem.statement}
          constraints={contestProblem.problem.constraints}
          samples={contestProblem.problem.testCases}
          languageOptions={supportedLanguageOptions()}
          submissions={submissions}
          submitAction={submitContestSolution}
          hiddenFields={{ contestSlug: contest.slug, problemLabel: contestProblem.label }}
          draftScope={`contest:${contest.slug}:${contestProblem.label}`}
          canSubmit
          rateLimited={searchParams?.error === "rate-limit"}
          rateLimitMessage="You have reached the daily submission limit."
        />
      </section>
    </main>
  );
}
