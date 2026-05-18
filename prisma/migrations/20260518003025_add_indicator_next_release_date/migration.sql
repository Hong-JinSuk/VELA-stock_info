-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "IndicatorSnapshot" ADD COLUMN     "nextReleaseDate" TEXT;
