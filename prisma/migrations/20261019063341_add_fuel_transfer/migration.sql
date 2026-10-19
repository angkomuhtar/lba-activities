-- AlterTable
ALTER TABLE "stock_records" ADD COLUMN     "transferId" TEXT,
ADD COLUMN     "transferKeluar" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "transferMasuk" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "fuel_transfers" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "fromShipId" TEXT NOT NULL,
    "toShipId" TEXT NOT NULL,
    "jumlah" DECIMAL(65,30) NOT NULL,
    "catatan" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_transfers_fromShipId_idx" ON "fuel_transfers"("fromShipId");

-- CreateIndex
CREATE INDEX "fuel_transfers_toShipId_idx" ON "fuel_transfers"("toShipId");

-- CreateIndex
CREATE INDEX "stock_records_shipId_idx" ON "stock_records"("shipId");

-- AddForeignKey
ALTER TABLE "stock_records" ADD CONSTRAINT "stock_records_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "fuel_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_transfers" ADD CONSTRAINT "fuel_transfers_fromShipId_fkey" FOREIGN KEY ("fromShipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_transfers" ADD CONSTRAINT "fuel_transfers_toShipId_fkey" FOREIGN KEY ("toShipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
