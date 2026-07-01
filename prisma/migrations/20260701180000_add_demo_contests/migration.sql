-- Demo contests are virtual contests: each participant's timer starts when they register.
ALTER TABLE "Contest" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contest" ADD COLUMN "durationMinutes" INTEGER;
