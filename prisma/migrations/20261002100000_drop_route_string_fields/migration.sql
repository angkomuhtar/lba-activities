-- DropTable
ALTER TABLE "voyages" DROP COLUMN "ruteAsal",
DROP COLUMN "ruteTujuan";

-- AlterTable
ALTER TABLE "voyage_plans" DROP COLUMN "rute_asal",
DROP COLUMN "rute_tujuan";