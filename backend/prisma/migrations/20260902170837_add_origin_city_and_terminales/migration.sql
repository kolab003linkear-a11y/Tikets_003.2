/*
  Warnings:

  - Added the required column `origin_city` to the `bus_routes` table without a default value. This is not possible if the table is not empty.

*/

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "BusOriginTerminal" ADD VALUE 'CALDERON';
ALTER TYPE "BusOriginTerminal" ADD VALUE 'GYE';
ALTER TYPE "BusOriginTerminal" ADD VALUE 'ABA';
ALTER TYPE "BusOriginTerminal" ADD VALUE 'MTA';

-- DropIndex
DROP INDEX IF EXISTS "bus_routes_origin_terminal_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "parking_lots_operator_status_idx";

-- AlterTable: add origin_city with a temporary default to backfill existing rows
ALTER TABLE "bus_routes" ADD COLUMN "origin_city" TEXT NOT NULL DEFAULT 'Quito';

-- Remove the temporary default now that rows are backfilled
ALTER TABLE "bus_routes" ALTER COLUMN "origin_city" DROP DEFAULT;

-- AlterTable
ALTER TABLE "parking_lots" ALTER COLUMN "operator" DROP DEFAULT,
ALTER COLUMN "opening_hours" DROP DEFAULT,
ALTER COLUMN "vehicle_types" DROP DEFAULT;

-- AlterTable
ALTER TABLE "parking_tickets" ALTER COLUMN "entry_metadata" DROP DEFAULT;
