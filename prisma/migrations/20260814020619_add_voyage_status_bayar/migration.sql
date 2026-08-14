-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DP', 'LUNAS');

-- AlterTable
ALTER TABLE "voyages" ADD COLUMN     "statusBayar" "PaymentStatus";
