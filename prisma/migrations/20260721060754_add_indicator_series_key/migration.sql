-- AlterTable
ALTER TABLE "AnalysisSectorIndicator" ADD COLUMN     "seriesKey" TEXT;

-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
