-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "RouteAccess" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;
