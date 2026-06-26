-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "KeyIndicator" (
    "indicatorId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeyIndicator_pkey" PRIMARY KEY ("indicatorId")
);

-- CreateIndex
CREATE INDEX "KeyIndicator_sortOrder_idx" ON "KeyIndicator"("sortOrder");

-- AddForeignKey
ALTER TABLE "KeyIndicator" ADD CONSTRAINT "KeyIndicator_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
