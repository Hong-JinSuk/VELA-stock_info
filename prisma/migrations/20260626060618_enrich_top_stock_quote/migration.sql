-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "TopStockQuote" ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "high52w" DOUBLE PRECISION,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "low52w" DOUBLE PRECISION,
ADD COLUMN     "marketCap" DOUBLE PRECISION,
ADD COLUMN     "priceReturn52w" DOUBLE PRECISION,
ADD COLUMN     "recBuy" INTEGER,
ADD COLUMN     "recHold" INTEGER,
ADD COLUMN     "recSell" INTEGER,
ADD COLUMN     "spark" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];

-- CreateIndex
CREATE INDEX "TopStockQuote_enrichedAt_idx" ON "TopStockQuote"("enrichedAt");
