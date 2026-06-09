-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "StockSymbol" (
    "symbol" TEXT NOT NULL,
    "displaySymbol" TEXT,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT,
    "mic" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockSymbol_pkey" PRIMARY KEY ("symbol")
);

-- CreateIndex
CREATE INDEX "StockSymbol_description_idx" ON "StockSymbol"("description");
