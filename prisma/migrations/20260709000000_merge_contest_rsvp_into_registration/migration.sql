-- Merge the standalone "RSVP" intent into contest registration (LeetCode style:
-- registering is the single commitment). Any existing RSVP that is not already a
-- registration is promoted to one, preserving its original createdAt so the
-- personal timer / standings math stays consistent.
INSERT INTO "ContestRegistration" ("id", "contestId", "userId", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text), "contestId", "userId", "createdAt"
FROM "ContestRsvp"
ON CONFLICT ("contestId", "userId") DO NOTHING;

-- DropForeignKey
ALTER TABLE "ContestRsvp" DROP CONSTRAINT "ContestRsvp_contestId_fkey";

-- DropForeignKey
ALTER TABLE "ContestRsvp" DROP CONSTRAINT "ContestRsvp_userId_fkey";

-- DropTable
DROP TABLE "ContestRsvp";
