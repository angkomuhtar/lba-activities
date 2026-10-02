-- AlterTable
ALTER TABLE "voyage_plans" ADD COLUMN     "rute_asal_id" TEXT,
ADD COLUMN     "rute_tujuan_id" TEXT;

-- AlterTable
ALTER TABLE "voyages" ADD COLUMN     "ruteAsalId" TEXT,
ADD COLUMN     "ruteTujuanId" TEXT;

-- AddForeignKey
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_ruteAsalId_fkey" FOREIGN KEY ("ruteAsalId") REFERENCES "jetties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_ruteTujuanId_fkey" FOREIGN KEY ("ruteTujuanId") REFERENCES "jetties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyage_plans" ADD CONSTRAINT "voyage_plans_rute_asal_id_fkey" FOREIGN KEY ("rute_asal_id") REFERENCES "jetties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyage_plans" ADD CONSTRAINT "voyage_plans_rute_tujuan_id_fkey" FOREIGN KEY ("rute_tujuan_id") REFERENCES "jetties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
