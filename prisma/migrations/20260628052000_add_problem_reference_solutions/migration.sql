CREATE TABLE "ProblemReferenceSolution" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemReferenceSolution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProblemReferenceSolution_problemId_language_key" ON "ProblemReferenceSolution"("problemId", "language");

CREATE INDEX "ProblemReferenceSolution_language_idx" ON "ProblemReferenceSolution"("language");

ALTER TABLE "ProblemReferenceSolution" ADD CONSTRAINT "ProblemReferenceSolution_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
