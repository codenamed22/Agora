-- CreateEnum
CREATE TYPE "ResourceSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ResourceSubmission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "recommendationReason" TEXT NOT NULL,
    "resourceLink" TEXT NOT NULL,
    "buyLink" TEXT,
    "imageUrl" TEXT,
    "status" "ResourceSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "categoryId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceSubmission_status_createdAt_idx" ON "ResourceSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceSubmission_submittedById_createdAt_idx" ON "ResourceSubmission"("submittedById", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceSubmission_categoryId_idx" ON "ResourceSubmission"("categoryId");

-- CreateIndex
CREATE INDEX "ResourceSubmission_reviewedById_idx" ON "ResourceSubmission"("reviewedById");

-- AddForeignKey
ALTER TABLE "ResourceSubmission" ADD CONSTRAINT "ResourceSubmission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSubmission" ADD CONSTRAINT "ResourceSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSubmission" ADD CONSTRAINT "ResourceSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
