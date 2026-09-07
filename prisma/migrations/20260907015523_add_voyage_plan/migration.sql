-- CreateTable
CREATE TABLE "voyage_plans" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "rute_asal" TEXT,
    "rute_tujuan" TEXT,
    "eta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voyage_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voyage_plans_shipId_key" ON "voyage_plans"("shipId");

-- AddForeignKey
ALTER TABLE "voyage_plans" ADD CONSTRAINT "voyage_plans_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
