CREATE TYPE "VoyageType" AS ENUM ('CQD', 'PRORATA');

ALTER TABLE "voyages"
ADD COLUMN "tipePelayaran" "VoyageType" NOT NULL DEFAULT 'CQD';

UPDATE "voyages"
SET "tipePelayaran" = 'PRORATA'
WHERE "prorata" IS NOT NULL
   OR "norLoadingStart" IS NOT NULL
   OR "norLoadingEnd" IS NOT NULL
   OR "norBongkarStart" IS NOT NULL
   OR "norBongkarEnd" IS NOT NULL;
