-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "recommendedById" TEXT;

-- CreateIndex
CREATE INDEX "Resource_recommendedById_idx" ON "Resource"("recommendedById");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
