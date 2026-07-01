-- All contests are self-timed now; drop the demo flag and backfill durations.
UPDATE "Contest"
SET "durationMinutes" = GREATEST(1, FLOOR(EXTRACT(EPOCH FROM ("endsAt" - "startsAt")) / 60))
WHERE "durationMinutes" IS NULL;

ALTER TABLE "Contest" DROP COLUMN "isDemo";
