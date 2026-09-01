DO $$ BEGIN
  CREATE TYPE "ParkingAccessMode" AS ENUM ('QR', 'TARJETA', 'TICKET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "ParkingTicketMode" AS ENUM ('QR', 'TARJETA', 'TICKET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "BusOriginTerminal" AS ENUM ('QUITUMBE', 'CARCELEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "parking_lots" ADD COLUMN IF NOT EXISTS "operator" TEXT NOT NULL DEFAULT 'Operador demo TiKetSafe';
ALTER TABLE "parking_lots" ADD COLUMN IF NOT EXISTS "opening_hours" TEXT NOT NULL DEFAULT 'Horario demo por confirmar';
ALTER TABLE "parking_lots" ADD COLUMN IF NOT EXISTS "terminal_name" TEXT;
ALTER TABLE "parking_lots" ADD COLUMN IF NOT EXISTS "access_mode" "ParkingAccessMode" NOT NULL DEFAULT 'QR';
ALTER TABLE "parking_lots" ADD COLUMN IF NOT EXISTS "vehicle_types" JSONB NOT NULL DEFAULT '["AUTO"]';
ALTER TABLE "parking_tickets" ADD COLUMN IF NOT EXISTS "entry_time" TIMESTAMP(3);
ALTER TABLE "parking_tickets" ADD COLUMN IF NOT EXISTS "exit_time" TIMESTAMP(3);
ALTER TABLE "parking_tickets" ADD COLUMN IF NOT EXISTS "ticket_mode" "ParkingTicketMode" NOT NULL DEFAULT 'QR';
ALTER TABLE "parking_tickets" ADD COLUMN IF NOT EXISTS "entry_metadata" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "bus_routes" ADD COLUMN IF NOT EXISTS "origin_terminal" "BusOriginTerminal" NOT NULL DEFAULT 'QUITUMBE';
ALTER TABLE "bus_trips" ADD COLUMN IF NOT EXISTS "boarding_platform" TEXT;
ALTER TABLE "bus_trips" ADD COLUMN IF NOT EXISTS "baggage_info" TEXT;

CREATE INDEX IF NOT EXISTS "parking_lots_operator_status_idx" ON "parking_lots"("operator", "status");
CREATE INDEX IF NOT EXISTS "bus_routes_origin_terminal_status_idx" ON "bus_routes"("origin_terminal", "status");
