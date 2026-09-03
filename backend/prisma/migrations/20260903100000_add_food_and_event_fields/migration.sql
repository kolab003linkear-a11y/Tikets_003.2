-- Add event metadata introduced by the admin event changes.
ALTER TABLE "movie_events" ADD COLUMN IF NOT EXISTS "age_rating" TEXT;
ALTER TABLE "movie_events" ALTER COLUMN "rating" TYPE DECIMAL(3,1);

DO $$ BEGIN
  CREATE TYPE "FoodCategory" AS ENUM ('COMBO', 'BEBIDA', 'COMIDA', 'SNACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "food_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" "FoodCategory" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reservation_items" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "reservation_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reservation_items_reservation_id_product_id_key" ON "reservation_items"("reservation_id", "product_id");
CREATE INDEX IF NOT EXISTS "food_products_category_active_idx" ON "food_products"("category", "active");
CREATE INDEX IF NOT EXISTS "reservation_items_reservation_id_idx" ON "reservation_items"("reservation_id");

DO $$ BEGIN
  ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "food_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
