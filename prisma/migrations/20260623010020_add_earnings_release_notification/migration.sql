-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EARNINGS_RELEASE';

-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
