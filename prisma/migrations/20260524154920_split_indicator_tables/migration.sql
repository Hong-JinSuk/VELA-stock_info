/*
  Warnings:

  - You are about to drop the `IndicatorSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MacroIndicatorSnapshot` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- DropTable
DROP TABLE "IndicatorSnapshot";

-- DropTable
DROP TABLE "MacroIndicatorSnapshot";

-- CreateTable
CREATE TABLE "Indicator" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "change" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "observationDate" TEXT,
    "nextReleaseDate" TEXT,
    "category" TEXT,
    "displayMeta" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorHistory" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "observationDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndicatorHistory_indicatorId_createdAt_idx" ON "IndicatorHistory"("indicatorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorHistory_indicatorId_dateKey_key" ON "IndicatorHistory"("indicatorId", "dateKey");

-- AddForeignKey
ALTER TABLE "IndicatorHistory" ADD CONSTRAINT "IndicatorHistory_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
