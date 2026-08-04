-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('hijau', 'kuning', 'merah');

-- CreateTable
CREATE TABLE "ships" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "muatan" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voyages" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "ruteAsal" TEXT,
    "ruteTujuan" TEXT,
    "tglStart" TIMESTAMP(3),
    "tglEnd" TIMESTAMP(3),
    "siNomor" TEXT,
    "siTanggal" TIMESTAMP(3),
    "spalNomor" TEXT,
    "spalTanggal" TIMESTAMP(3),
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voyages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_categories" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "warna" "ActivityStatus" NOT NULL,

    CONSTRAINT "activity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship_activities" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "aktivitas" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL,
    "catatan" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ship_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_records" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "stokAwal" DECIMAL(65,30) NOT NULL,
    "me" DECIMAL(65,30) NOT NULL,
    "ae" DECIMAL(65,30) NOT NULL,
    "sisaStok" DECIMAL(65,30) NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voyages_shipId_key" ON "voyages"("shipId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_categories_nama_key" ON "activity_categories"("nama");

-- AddForeignKey
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ship_activities" ADD CONSTRAINT "ship_activities_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_records" ADD CONSTRAINT "stock_records_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
