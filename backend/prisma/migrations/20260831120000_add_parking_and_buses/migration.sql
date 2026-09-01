CREATE TYPE "ParkingLotStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ParkingTicketStatus" AS ENUM ('VALID', 'USED', 'EXPIRED');
CREATE TYPE "BusRouteStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "BusTripStatus" AS ENUM ('SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'CANCELLED');
CREATE TYPE "BusTicketStatus" AS ENUM ('VALID', 'USED', 'EXPIRED');

CREATE TABLE "parking_lots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "total_spaces" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "ParkingLotStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "parking_lots_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "parking_tickets" (
    "id" TEXT NOT NULL,
    "parking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "space_number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "qr_code_hash" TEXT NOT NULL,
    "status" "ParkingTicketStatus" NOT NULL DEFAULT 'VALID',
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parking_tickets_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "bus_routes" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "status" "BusRouteStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bus_routes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "bus_trips" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "arrival_time" TIMESTAMP(3),
    "price" DECIMAL(10,2) NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "status" "BusTripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bus_trips_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "bus_tickets" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "qr_code_hash" TEXT NOT NULL,
    "status" "BusTicketStatus" NOT NULL DEFAULT 'VALID',
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bus_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parking_tickets_qr_code_hash_key" ON "parking_tickets"("qr_code_hash");
CREATE UNIQUE INDEX "parking_tickets_parking_id_space_number_date_key" ON "parking_tickets"("parking_id", "space_number", "date");
CREATE INDEX "parking_lots_city_status_idx" ON "parking_lots"("city", "status");
CREATE INDEX "parking_tickets_user_id_status_idx" ON "parking_tickets"("user_id", "status");
CREATE UNIQUE INDEX "bus_trips_route_id_departure_time_key" ON "bus_trips"("route_id", "departure_time");
CREATE INDEX "bus_routes_origin_destination_status_idx" ON "bus_routes"("origin", "destination", "status");
CREATE INDEX "bus_trips_departure_time_status_idx" ON "bus_trips"("departure_time", "status");
CREATE UNIQUE INDEX "bus_tickets_qr_code_hash_key" ON "bus_tickets"("qr_code_hash");
CREATE UNIQUE INDEX "bus_tickets_trip_id_seat_number_key" ON "bus_tickets"("trip_id", "seat_number");
CREATE INDEX "bus_tickets_user_id_status_idx" ON "bus_tickets"("user_id", "status");

ALTER TABLE "parking_tickets" ADD CONSTRAINT "parking_tickets_parking_id_fkey" FOREIGN KEY ("parking_id") REFERENCES "parking_lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parking_tickets" ADD CONSTRAINT "parking_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bus_trips" ADD CONSTRAINT "bus_trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bus_tickets" ADD CONSTRAINT "bus_tickets_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "bus_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bus_tickets" ADD CONSTRAINT "bus_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;