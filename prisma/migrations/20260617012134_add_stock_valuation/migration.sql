-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "StockValuation" (
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "forwardPe" DOUBLE PRECISION,
    "growthPct" DOUBLE PRECISION,
    "growthSource" TEXT NOT NULL,
    "roaTtm" DOUBLE PRECISION,
    "high52w" DOUBLE PRECISION,
    "targetPeg" DOUBLE PRECISION NOT NULL,
    "fairPe" DOUBLE PRECISION,
    "fairValue" DOUBLE PRECISION,
    "upsidePct" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockValuation_pkey" PRIMARY KEY ("symbol")
);

-- CreateIndex
CREATE INDEX "StockValuation_snapshotAt_idx" ON "StockValuation"("snapshotAt");

-- AddForeignKey
ALTER TABLE "StockValuation" ADD CONSTRAINT "StockValuation_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "StockSymbol"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;
