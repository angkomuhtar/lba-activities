BEGIN;

-- Eksis: pindah data lama ke skema ledger baru.
-- Asumsi: data stock & refill lama adalah data uji/seed. Saldo berjalan dihitung ulang.

-- 1. Enum + tabel baru
CREATE TYPE "FuelTipe" AS ENUM ('MASUK', 'KELUAR');

CREATE TABLE "fuel_records" (
  "id" TEXT NOT NULL,
  "shipId" TEXT NOT NULL,
  "tanggal" TIMESTAMP(3) NOT NULL,
  "tipe" "FuelTipe" NOT NULL,
  "me" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "ae" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "jumlah" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "saldo" DECIMAL(65,30) NOT NULL,
  "catatan" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fuel_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fuel_records_shipId_idx" ON "fuel_records"("shipId");

ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_shipId_fkey"
  FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Kolom fuelAwal di ships
ALTER TABLE "ships" ADD COLUMN "fuelAwal" DECIMAL(65,30);

-- 3. Saldo awal tiap kapal dari record pemakaian tertua (stok awal manual).
--    Tidak ada data -> NULL.
UPDATE "ships" AS s
SET "fuelAwal" = sub."firstStok"
FROM (
  SELECT DISTINCT ON ("shipId") "shipId", sr."stokAwal" AS "firstStok"
  FROM "stock_records" sr
  ORDER BY "shipId", sr."tanggal" ASC, sr."createdAt" ASC
) sub
WHERE s."id" = sub."shipId";

-- 4. Pindah pemakaian (stock_records -> MASUK asli? No: pemakaian = KELUAR)
INSERT INTO "fuel_records" ("id", "shipId", "tanggal", "tipe", "me", "ae", "jumlah", "saldo", "catatan", "createdAt")
SELECT
  "id",
  "shipId",
  "tanggal",
  'KELUAR'::"FuelTipe",
  "me",
  "ae",
  ("me" + "ae"),
  "sisaStok",
  "catatan",
  "createdAt"
FROM "stock_records";

-- 5. Pindah pengisian (fuel_refills) -> MASUK.
INSERT INTO "fuel_records" ("id", "shipId", "tanggal", "tipe", "me", "ae", "jumlah", "saldo", "catatan", "createdById", "createdAt")
SELECT
  "id",
  "shipId",
  "tanggal",
  'MASUK'::"FuelTipe",
  0,
  0,
  "jumlah",
  0,
  "catatan",
  "createdById",
  "createdAt"
FROM "fuel_refills";

-- 6. Hitung ulang saldo berjalan untuk SEMUA record kapal secara kronologis.
--    Saldo = stok awal + jml MASUK - sum(me+ae) KELUAR, berurutan tanggal/createdAt.
UPDATE "fuel_records" AS fr
SET "saldo" = sub."running"
FROM (
  SELECT
    frr."id",
    COALESCE(s."fuelAwal", 0) +
    SUM(CASE WHEN frr."tipe" = 'MASUK' THEN frr."jumlah"
             ELSE - (frr."me" + frr."ae") END)
        OVER (
          PARTITION BY frr."shipId"
          ORDER BY frr."tanggal" ASC, frr."createdAt" ASC, frr."id" ASC
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS "running"
  FROM "fuel_records" frr
  JOIN "ships" s ON s."id" = frr."shipId"
) sub
WHERE fr."id" = sub."id";

-- 7. Drop lagu
DROP TABLE "stock_records";
DROP TABLE "fuel_refills";

COMMIT;