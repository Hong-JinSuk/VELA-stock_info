-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "ThirteenFSectorPoint" (
    "cik" VARCHAR(10) NOT NULL,
    "periodEnding" VARCHAR(10) NOT NULL,
    "sector" TEXT NOT NULL,
    "weightPercent" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ThirteenFSectorPoint_pkey" PRIMARY KEY ("cik","periodEnding","sector")
);

-- CreateIndex
CREATE INDEX "ThirteenFSectorPoint_cik_periodEnding_idx" ON "ThirteenFSectorPoint"("cik", "periodEnding" DESC);
