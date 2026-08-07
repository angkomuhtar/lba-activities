-- CreateTable
CREATE TABLE "fuel_refills" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jumlah" DECIMAL(65,30) NOT NULL,
    "catatan" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_refills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_refills_shipId_idx" ON "fuel_refills"("shipId");

-- AddForeignKey
ALTER TABLE "fuel_refills" ADD CONSTRAINT "fuel_refills_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
