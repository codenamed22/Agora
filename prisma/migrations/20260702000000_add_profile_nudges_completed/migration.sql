ALTER TABLE "Profile" ADD COLUMN "nudgesCompleted" INTEGER NOT NULL DEFAULT 0;

UPDATE "Profile" AS p
SET "nudgesCompleted" = sub.cnt
FROM (
  SELECT "recipientId", COUNT(*)::int AS cnt
  FROM "Nudge"
  WHERE "status" = 'COMPLETED'
  GROUP BY "recipientId"
) AS sub
WHERE p."userId" = sub."recipientId";
