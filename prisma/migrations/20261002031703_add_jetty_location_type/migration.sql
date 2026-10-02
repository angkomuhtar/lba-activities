-- CreateEnum
CREATE TYPE "JettyType" AS ENUM ('LOADING', 'DISCHARGING');

-- AlterTable
ALTER TABLE "jetties" ADD COLUMN     "location" TEXT,
ADD COLUMN     "type" "JettyType",
ALTER COLUMN "lat" DROP NOT NULL,
ALTER COLUMN "lon" DROP NOT NULL;
