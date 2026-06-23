-- CreateEnum
CREATE TYPE "TeachingArtifactType" AS ENUM ('MEET', 'SLIDES', 'RECORDING', 'EXCALIDRAW');

-- CreateTable
CREATE TABLE "TeachingSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "sessionDate" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingArtifact" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "TeachingArtifactType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeachingSession_createdAt_idx" ON "TeachingSession"("createdAt");

-- CreateIndex
CREATE INDEX "TeachingSession_createdById_idx" ON "TeachingSession"("createdById");

-- CreateIndex
CREATE INDEX "TeachingArtifact_sessionId_idx" ON "TeachingArtifact"("sessionId");

-- AddForeignKey
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingArtifact" ADD CONSTRAINT "TeachingArtifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
