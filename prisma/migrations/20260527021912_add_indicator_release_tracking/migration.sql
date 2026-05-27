-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "prevPreviousValue" DOUBLE PRECISION,
ADD COLUMN     "releasedAt" TIMESTAMPTZ(3);
