-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "BatchLog" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "result" JSONB,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchLog_job_createdAt_idx" ON "BatchLog"("job", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BatchLog_createdAt_idx" ON "BatchLog"("createdAt" DESC);
