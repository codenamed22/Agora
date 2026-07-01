-- Member-to-member nudges for accountability challenges.
CREATE TYPE "NudgeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Nudge" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "status" "NudgeStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Nudge_recipientId_status_idx" ON "Nudge"("recipientId", "status");
CREATE INDEX "Nudge_senderId_status_idx" ON "Nudge"("senderId", "status");

ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
