-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "AnalysisSectorIndicator" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnalysisSectorIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisSectorIndicator_sectorId_sortOrder_idx" ON "AnalysisSectorIndicator"("sectorId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AnalysisSectorIndicator" ADD CONSTRAINT "AnalysisSectorIndicator_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "AnalysisSector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
