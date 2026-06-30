-- AlterTable: add cohort link + dynamic answers.
-- Legacy columns (goals, experience, whyJoin) are kept as read-only data, not dropped.
ALTER TABLE "Application" ADD COLUMN     "answers" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "cohortId" TEXT;

-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cohort_year_key" ON "Cohort"("year");

-- CreateIndex
CREATE INDEX "Application_cohortId_idx" ON "Application"("cohortId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
