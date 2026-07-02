-- Rename Codeforces-style contest tier badges to shard-themed names.
-- Existing member assignments carry over since only the badge name changes.
UPDATE "Badge" SET "name" = 'Rough Shard' WHERE "name" = 'Contest Newbie';
UPDATE "Badge" SET "name" = 'Cut Shard' WHERE "name" = 'Contest Pupil';
UPDATE "Badge" SET "name" = 'Polished Shard' WHERE "name" = 'Contest Specialist';
UPDATE "Badge" SET "name" = 'Radiant Shard' WHERE "name" = 'Contest Expert';
UPDATE "Badge" SET "name" = 'Molten Shard' WHERE "name" = 'Contest Candidate Master';
