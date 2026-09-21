-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "pdfSizeBytes" INTEGER,
ADD COLUMN     "pdfUrl" TEXT,
ALTER COLUMN "resourceLink" DROP NOT NULL;
