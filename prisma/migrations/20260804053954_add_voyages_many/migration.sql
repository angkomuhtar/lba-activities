-- DropIndex
DROP INDEX "voyages_shipId_key";

-- AlterTable
ALTER TABLE "ship_activities" ADD COLUMN     "voyageId" TEXT;

-- CreateIndex
CREATE INDEX "ship_activities_shipId_idx" ON "ship_activities"("shipId");

-- CreateIndex
CREATE INDEX "ship_activities_voyageId_idx" ON "ship_activities"("voyageId");

-- CreateIndex
CREATE INDEX "voyages_shipId_idx" ON "voyages"("shipId");

-- AddForeignKey
ALTER TABLE "ship_activities" ADD CONSTRAINT "ship_activities_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "voyages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
