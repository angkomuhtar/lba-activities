BEGIN;

-- Revert ke format awal: hanya pencatatan keluar (stock_records), tanpa
-- pengisian (fuel_refills) dan tanpa ledger (fuel_records / FuelTipe / fuelAwal).
-- Menggunakan do-block kondisional agar aman di kedua state:
--   - dev yang sudah menjalankan unify_fuel_ledger (fuel_records, FuelTipe, fuelAwal)
--   - prod yang hanya punya fuel_refills (stock_records masih ada)

-- 1) Rekonstruksi stock_records dari data KELUAR (pemakaian) bila belum ada.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_records') THEN
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
  END IF;

  -- Replikasi data pemakaian dari ledger (jika tabel ledger ada) ke stock_records.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fuel_records') THEN
    INSERT INTO "stock_records" ("id", "shipId", "tanggal", "stokAwal", "me", "ae", "sisaStok", "catatan", "createdAt")
    SELECT
      "id",
      "shipId",
      "tanggal",
      ("saldo" + "me" + "ae"),  -- stok awal = saldo setelah + pemakaian record ini
      "me",
      "ae",
      "saldo",                  -- saldo berjalan == sisa stok
      "catatan",
      "createdAt"
    FROM "fuel_records"
    WHERE "tipe" = 'KELUAR'
    ORDER BY "tanggal" ASC, "createdAt" ASC;
  END IF;
END $$;

-- 2) Hapus tabel ledger kalau ada (dev).
DROP TABLE IF EXISTS "fuel_records";

-- 3) Hapus tabel pengisian kalau ada (prod/dev lama).
DROP TABLE IF EXISTS "fuel_refills";

-- 4) Hapus type ledger & kolom fuelAwal kalau ada.
DROP TYPE IF EXISTS "FuelTipe";
ALTER TABLE "ships" DROP COLUMN IF EXISTS "fuelAwal";

-- 5) Index shipId (opsional, mempercepat query pemakaian per kapal).
CREATE INDEX IF NOT EXISTS "stock_records_shipId_idx" ON "stock_records"("shipId");

COMMIT;