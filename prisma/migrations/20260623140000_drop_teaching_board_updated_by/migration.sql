-- DropForeignKey
ALTER TABLE "TeachingBoard" DROP CONSTRAINT IF EXISTS "TeachingBoard_updatedById_fkey";

-- DropIndex
DROP INDEX IF EXISTS "TeachingBoard_updatedById_idx";

-- AlterTable
ALTER TABLE "TeachingBoard" DROP COLUMN IF EXISTS "updatedById";
