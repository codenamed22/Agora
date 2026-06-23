-- CreateTable
CREATE TABLE "TeachingBoard" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scene" JSONB,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeachingBoard_sessionId_idx" ON "TeachingBoard"("sessionId");

-- CreateIndex
CREATE INDEX "TeachingBoard_updatedById_idx" ON "TeachingBoard"("updatedById");

-- AddForeignKey
ALTER TABLE "TeachingBoard" ADD CONSTRAINT "TeachingBoard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingBoard" ADD CONSTRAINT "TeachingBoard_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
