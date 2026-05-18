-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "IndicatorSnapshot" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "observationDate" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "change" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndicatorSnapshot_indicatorId_dateKey_idx" ON "IndicatorSnapshot"("indicatorId", "dateKey");

-- CreateIndex
CREATE INDEX "IndicatorSnapshot_createdAt_idx" ON "IndicatorSnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorSnapshot_indicatorId_dateKey_key" ON "IndicatorSnapshot"("indicatorId", "dateKey");
