-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "ThirteenFFiler" (
    "cik" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "lastFiledDate" VARCHAR(10) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThirteenFFiler_pkey" PRIMARY KEY ("cik")
);

-- CreateIndex
CREATE INDEX "ThirteenFFiler_name_idx" ON "ThirteenFFiler"("name");
