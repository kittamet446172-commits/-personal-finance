-- CreateEnum
CREATE TYPE "BillFrequency" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "bills" ADD COLUMN "dueMonth" INTEGER,
ADD COLUMN "frequency" "BillFrequency" NOT NULL DEFAULT 'MONTHLY';
