-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('STOCK', 'THIRTEENF_FILER');

-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "FavoriteType" NOT NULL,
    "itemKey" TEXT NOT NULL,
    "label" TEXT,
    "memo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_userId_type_sortOrder_idx" ON "Favorite"("userId", "type", "sortOrder");

-- CreateIndex
CREATE INDEX "Favorite_type_itemKey_idx" ON "Favorite"("type", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_type_itemKey_key" ON "Favorite"("userId", "type", "itemKey");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
