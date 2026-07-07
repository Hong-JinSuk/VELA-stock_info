-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "ValuationWatch" (
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationWatch_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "StockLogo" (
    "symbol" TEXT NOT NULL,
    "logo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLogo_pkey" PRIMARY KEY ("symbol")
);
