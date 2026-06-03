-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "BatchLogItem" (
    "id" TEXT NOT NULL,
    "batchLogId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchLogItem_batchLogId_idx" ON "BatchLogItem"("batchLogId");

-- AddForeignKey
ALTER TABLE "BatchLogItem" ADD CONSTRAINT "BatchLogItem_batchLogId_fkey" FOREIGN KEY ("batchLogId") REFERENCES "BatchLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
