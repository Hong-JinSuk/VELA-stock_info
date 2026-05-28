-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "ThirteenFFiler" ADD COLUMN     "krName" TEXT;

-- CreateIndex
CREATE INDEX "ThirteenFFiler_krName_idx" ON "ThirteenFFiler"("krName");
