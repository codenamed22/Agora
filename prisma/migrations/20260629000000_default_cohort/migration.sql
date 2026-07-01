-- Seed a default active cohort so recruitment works immediately after deploy.
-- Production databases don't run the seed script, so without this every visitor
-- to /apply would see "Recruitment closed" until an admin manually opens one.
-- Only inserts when no cohort exists yet, so it is a no-op on databases that
-- already have one (e.g. anywhere the seed already ran).
INSERT INTO "Cohort" ("id", "year", "isActive", "questions", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  2027,
  true,
  jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'label', 'What do you want to build or improve through ShardUp?',
      'required', true
    ),
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'label', 'Relevant experience or projects',
      'required', false
    )
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Cohort");
