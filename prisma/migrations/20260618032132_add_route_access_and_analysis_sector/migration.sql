-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "RouteAccess" (
    "routeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minRole" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteAccess_pkey" PRIMARY KEY ("routeKey")
);

-- CreateTable
CREATE TABLE "AnalysisSector" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisSectorItem" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnalysisSectorItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisSector_slug_key" ON "AnalysisSector"("slug");

-- CreateIndex
CREATE INDEX "AnalysisSector_sortOrder_idx" ON "AnalysisSector"("sortOrder");

-- CreateIndex
CREATE INDEX "AnalysisSectorItem_sectorId_sortOrder_idx" ON "AnalysisSectorItem"("sectorId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisSectorItem_sectorId_symbol_key" ON "AnalysisSectorItem"("sectorId", "symbol");

-- AddForeignKey
ALTER TABLE "AnalysisSectorItem" ADD CONSTRAINT "AnalysisSectorItem_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "AnalysisSector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
