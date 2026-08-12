-- DropIndex
DROP INDEX "stock_records_shipId_idx";

-- AlterTable
ALTER TABLE "voyages" ADD COLUMN     "shipper" TEXT;

-- AddForeignKey
ALTER TABLE "stock_records" ADD CONSTRAINT "stock_records_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
