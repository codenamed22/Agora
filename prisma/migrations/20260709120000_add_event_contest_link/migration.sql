-- Link an Event to the Contest it was synced from, so publishing a contest can
-- create/update a single matching event without ever duplicating it.
ALTER TABLE "Event" ADD COLUMN "contestId" TEXT;

CREATE UNIQUE INDEX "Event_contestId_key" ON "Event"("contestId");

ALTER TABLE "Event" ADD CONSTRAINT "Event_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
