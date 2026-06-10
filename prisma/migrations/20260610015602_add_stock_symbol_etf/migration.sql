-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "StockSymbolEtf" (
    "symbol" TEXT NOT NULL,
    "stockPct" DOUBLE PRECISION,
    "bondPct" DOUBLE PRECISION,
    "cashPct" DOUBLE PRECISION,
    "entered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exited" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockSymbolEtf_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "StockSymbolEtfHolding" (
    "id" UUID NOT NULL,
    "etfSymbol" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "symbol" TEXT,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StockSymbolEtfHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockSymbolEtfHolding_etfSymbol_idx" ON "StockSymbolEtfHolding"("etfSymbol");

-- CreateIndex
CREATE INDEX "StockSymbolEtfHolding_symbol_idx" ON "StockSymbolEtfHolding"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "StockSymbolEtfHolding_etfSymbol_rank_key" ON "StockSymbolEtfHolding"("etfSymbol", "rank");

-- AddForeignKey
ALTER TABLE "StockSymbolEtf" ADD CONSTRAINT "StockSymbolEtf_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "StockSymbol"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockSymbolEtfHolding" ADD CONSTRAINT "StockSymbolEtfHolding_etfSymbol_fkey" FOREIGN KEY ("etfSymbol") REFERENCES "StockSymbolEtf"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;
