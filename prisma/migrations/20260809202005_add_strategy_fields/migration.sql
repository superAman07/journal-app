-- AlterTable
ALTER TABLE "strategies" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "market" TEXT,
ADD COLUMN     "rules" TEXT,
ADD COLUMN     "targetRR" DOUBLE PRECISION DEFAULT 2.0,
ADD COLUMN     "timeframe" TEXT;
