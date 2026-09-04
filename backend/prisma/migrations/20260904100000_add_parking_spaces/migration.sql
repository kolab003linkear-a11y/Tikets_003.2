CREATE TYPE "ParkingSpaceStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'CLOSED');

CREATE TABLE "parking_spaces" (
    "id" TEXT NOT NULL,
    "parking_id" TEXT NOT NULL,
    "space_number" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "code" TEXT NOT NULL,
    "status" "ParkingSpaceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "parking_spaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parking_spaces_parking_id_space_number_key" ON "parking_spaces"("parking_id", "space_number");
CREATE UNIQUE INDEX "parking_spaces_parking_id_code_key" ON "parking_spaces"("parking_id", "code");
CREATE INDEX "parking_spaces_parking_id_status_idx" ON "parking_spaces"("parking_id", "status");
ALTER TABLE "parking_spaces" ADD CONSTRAINT "parking_spaces_parking_id_fkey" FOREIGN KEY ("parking_id") REFERENCES "parking_lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;