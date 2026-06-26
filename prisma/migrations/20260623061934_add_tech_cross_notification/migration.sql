-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TECH_CROSS';

-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
