-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "beta" BOOLEAN NOT NULL DEFAULT false;
