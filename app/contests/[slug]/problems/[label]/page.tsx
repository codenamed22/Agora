import { UserStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import {
  contestPhase,
  contestWindowForUser,
  formatContestWindow,
  isContestLive,
} from "../../../../../lib/contest";
import { supportedLanguageOptions } from "../../../../../lib/judge";
import { prisma } from "../../../../../lib/prisma";
import { ContestSubmissionPanel } from "./contest-submission-panel";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Contest problem</p>
        <h1>
          {contestProblem.label}. {contestProblem.problem.title}
        </h1>
        <p className="nudge-meta">
          <a href={`/contests/${contest.slug}`}>{contest.title}</a> ·{" "}
          {contestPhase(contest, new Date(), registration.createdAt)}
        </p>
        <p className="nudge-meta">
          Your window:{" "}
          {(() => {
            const window = contestWindowForUser(contest, registration.createdAt);
            return formatContestWindow(window.startsAt, window.endsAt);
          })()}
        </p>

        {searchParams?.error === "rate-limit" ? (
          <div className="form-message error">You have reached the daily submission limit.</div>
        ) : null}

        <div className="problem-statement">{contestProblem.problem.statement}</div>

        {contestProblem.problem.constraints ? (
          <div className="problem-section">
            <h2>Constraints</h2>
            <p>{contestProblem.problem.constraints}</p>
          </div>
        ) : null}

        {contestProblem.problem.testCases.length > 0 ? (
          <div className="problem-section">
            <h2>Sample tests</h2>
            {contestProblem.problem.testCases.map((testCase) => (
              <div className="sample-test" key={testCase.id}>
                <p>
                  <strong>Input</strong>
                </p>
                <pre>{testCase.input}</pre>
                <p>
                  <strong>Output</strong>
                </p>
                <pre>{testCase.expectedOutput}</pre>
              </div>
            ))}
          </div>
        ) : null}

        <ContestSubmissionPanel
          contestSlug={contest.slug}
          languageOptions={supportedLanguageOptions()}
          problemLabel={contestProblem.label}
          submissions={submissions}
        />
      </section>
    </main>
  );
}
