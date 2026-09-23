-- AlterTable
ALTER TABLE "voyages" ADD COLUMN     "norBongkarEnd" TIMESTAMP(3),
ADD COLUMN     "norBongkarStart" TIMESTAMP(3),
ADD COLUMN     "norLoadingEnd" TIMESTAMP(3),
ADD COLUMN     "norLoadingStart" TIMESTAMP(3),
ADD COLUMN     "prorata" INTEGER;
