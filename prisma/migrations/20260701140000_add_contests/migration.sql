-- Coding contests with ICPC standings and Codeforces-style rating.
CREATE TYPE "ContestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'FINALIZED');

ALTER TABLE "Profile" ADD COLUMN "contestRating" INTEGER NOT NULL DEFAULT 1500;

CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContestProblem" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContestProblem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContestRegistration" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContestSubmission" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "contestProblemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verdict" "SubmissionVerdict" NOT NULL DEFAULT 'PENDING',
    "runtimeMs" INTEGER,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContestParticipant" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "solvedCount" INTEGER NOT NULL,
    "penalty" INTEGER NOT NULL,
    "ratingBefore" INTEGER NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "ratingDelta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contest_slug_key" ON "Contest"("slug");
CREATE INDEX "Contest_status_startsAt_idx" ON "Contest"("status", "startsAt");
CREATE INDEX "Contest_createdById_idx" ON "Contest"("createdById");

CREATE UNIQUE INDEX "ContestProblem_contestId_problemId_key" ON "ContestProblem"("contestId", "problemId");
CREATE UNIQUE INDEX "ContestProblem_contestId_label_key" ON "ContestProblem"("contestId", "label");
CREATE INDEX "ContestProblem_contestId_order_idx" ON "ContestProblem"("contestId", "order");

CREATE UNIQUE INDEX "ContestRegistration_contestId_userId_key" ON "ContestRegistration"("contestId", "userId");
CREATE INDEX "ContestRegistration_userId_idx" ON "ContestRegistration"("userId");

CREATE INDEX "ContestSubmission_contestId_userId_idx" ON "ContestSubmission"("contestId", "userId");
CREATE INDEX "ContestSubmission_contestId_contestProblemId_verdict_idx" ON "ContestSubmission"("contestId", "contestProblemId", "verdict");

CREATE UNIQUE INDEX "ContestParticipant_contestId_userId_key" ON "ContestParticipant"("contestId", "userId");
CREATE INDEX "ContestParticipant_userId_createdAt_idx" ON "ContestParticipant"("userId", "createdAt");

ALTER TABLE "Contest" ADD CONSTRAINT "Contest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestRegistration" ADD CONSTRAINT "ContestRegistration_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestRegistration" ADD CONSTRAINT "ContestRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_contestProblemId_fkey" FOREIGN KEY ("contestProblemId") REFERENCES "ContestProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestParticipant" ADD CONSTRAINT "ContestParticipant_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestParticipant" ADD CONSTRAINT "ContestParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
