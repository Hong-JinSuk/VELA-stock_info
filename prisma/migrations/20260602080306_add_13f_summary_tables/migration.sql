-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "ThirteenFSummary" (
    "id" UUID NOT NULL,
    "cik" VARCHAR(10) NOT NULL,
    "accession" VARCHAR(20) NOT NULL,
    "periodEnding" VARCHAR(10) NOT NULL,
    "fileDate" VARCHAR(10) NOT NULL,
    "aumUsd" BIGINT NOT NULL,
    "qoqPercent" DOUBLE PRECISION,
    "holdingCount" INTEGER NOT NULL,
    "topSectors" JSONB NOT NULL,
    "topHoldings" JSONB NOT NULL,
    "topBuys" JSONB NOT NULL,
    "topSells" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirteenFSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirteenFAumPoint" (
    "cik" VARCHAR(10) NOT NULL,
    "periodEnding" VARCHAR(10) NOT NULL,
    "aumUsd" BIGINT NOT NULL,
    "holdingCount" INTEGER NOT NULL,

    CONSTRAINT "ThirteenFAumPoint_pkey" PRIMARY KEY ("cik","periodEnding")
);

-- CreateTable
CREATE TABLE "TickerSector" (
    "ticker" TEXT NOT NULL,
    "finnhubIndustry" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerSector_pkey" PRIMARY KEY ("ticker")
);

-- CreateIndex
CREATE INDEX "ThirteenFSummary_fileDate_idx" ON "ThirteenFSummary"("fileDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ThirteenFSummary_cik_periodEnding_key" ON "ThirteenFSummary"("cik", "periodEnding");

-- CreateIndex
CREATE INDEX "ThirteenFAumPoint_cik_periodEnding_idx" ON "ThirteenFAumPoint"("cik", "periodEnding" DESC);

-- AddForeignKey
ALTER TABLE "ThirteenFSummary" ADD CONSTRAINT "ThirteenFSummary_cik_fkey" FOREIGN KEY ("cik") REFERENCES "ThirteenFFiler"("cik") ON DELETE CASCADE ON UPDATE CASCADE;
