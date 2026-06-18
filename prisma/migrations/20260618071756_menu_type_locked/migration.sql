-- AlterTable
ALTER TABLE "DailySnapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'LINK';

-- Backfill: 하위를 가진 메뉴(대분류)는 FOLDER로. 나머지는 기본 LINK 유지.
UPDATE "Menu" SET "type" = 'FOLDER'
WHERE "id" IN (SELECT "parentId" FROM "Menu" WHERE "parentId" IS NOT NULL);
