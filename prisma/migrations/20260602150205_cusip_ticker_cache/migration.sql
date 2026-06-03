-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "CusipTicker" (
    "cusip" VARCHAR(9) NOT NULL,
    "ticker" TEXT,
    "name" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CusipTicker_pkey" PRIMARY KEY ("cusip")
);
