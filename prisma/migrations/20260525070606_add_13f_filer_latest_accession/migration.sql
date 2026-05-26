-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "ThirteenFFiler" ADD COLUMN     "latestAccession" VARCHAR(20);

-- CreateIndex
CREATE INDEX "ThirteenFFiler_lastFiledDate_idx" ON "ThirteenFFiler"("lastFiledDate");
