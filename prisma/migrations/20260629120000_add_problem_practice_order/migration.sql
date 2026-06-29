ALTER TABLE "Problem" ADD COLUMN "practiceOrder" INTEGER NOT NULL DEFAULT 100000;

CREATE INDEX "Problem_published_practiceOrder_idx" ON "Problem"("published", "practiceOrder");
