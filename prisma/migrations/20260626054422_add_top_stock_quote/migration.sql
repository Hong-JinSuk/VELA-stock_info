-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "TopStockQuote" (
    "symbol" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "change" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "snapshotAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopStockQuote_pkey" PRIMARY KEY ("symbol")
);

-- CreateIndex
CREATE INDEX "TopStockQuote_rank_idx" ON "TopStockQuote"("rank");
