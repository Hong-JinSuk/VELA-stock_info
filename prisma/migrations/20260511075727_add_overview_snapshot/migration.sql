-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('AI_INSIGHT', 'MARKET_SUMMARY');

-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "type" "SnapshotType" NOT NULL,
    "dateKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroIndicatorSnapshot" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "valueMain" TEXT NOT NULL,
    "valueSuffix" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroIndicatorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailySnapshot_type_dateKey_idx" ON "DailySnapshot"("type", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "DailySnapshot_type_dateKey_key" ON "DailySnapshot"("type", "dateKey");

-- CreateIndex
CREATE INDEX "MacroIndicatorSnapshot_indicatorId_dateKey_idx" ON "MacroIndicatorSnapshot"("indicatorId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "MacroIndicatorSnapshot_indicatorId_dateKey_key" ON "MacroIndicatorSnapshot"("indicatorId", "dateKey");
