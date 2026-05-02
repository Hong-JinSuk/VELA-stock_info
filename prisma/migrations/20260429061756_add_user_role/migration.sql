-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FREE', 'PRO', 'MAX', 'ADMIN', 'TESTER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'FREE';
