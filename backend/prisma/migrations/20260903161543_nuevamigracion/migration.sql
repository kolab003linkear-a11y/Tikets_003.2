/*
  Warnings:

  - You are about to drop the column `available_seats` on the `showtimes` table. All the data in the column will be lost.
  - You are about to drop the column `movie_id` on the `showtimes` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `showtimes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[room_id,start_time]` on the table `showtimes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `movie_event_id` to the `showtimes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('COMBO', 'BEBIDA', 'COMIDA', 'SNACK');

-- DropForeignKey
ALTER TABLE "showtimes" DROP CONSTRAINT "showtimes_movie_id_fkey";

-- DropIndex
DROP INDEX "showtimes_movie_id_idx";

-- DropIndex
DROP INDEX "showtimes_movie_id_room_id_start_time_key";

-- DropIndex
DROP INDEX "showtimes_start_time_idx";

-- AlterTable
ALTER TABLE "movie_events" ADD COLUMN     "ageRating" TEXT,
ALTER COLUMN "rating" SET DATA TYPE DECIMAL(3,1);

-- AlterTable
ALTER TABLE "showtimes" DROP COLUMN "available_seats",
DROP COLUMN "movie_id",
DROP COLUMN "price",
ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "movie_event_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "food_products" (
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

-- CreateTable
CREATE TABLE "reservation_items" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "reservation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "food_products_category_active_idx" ON "food_products"("category", "active");

-- CreateIndex
CREATE INDEX "reservation_items_reservation_id_idx" ON "reservation_items"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_items_reservation_id_product_id_key" ON "reservation_items"("reservation_id", "product_id");

-- CreateIndex
CREATE INDEX "showtimes_movie_event_id_start_time_idx" ON "showtimes"("movie_event_id", "start_time");

-- CreateIndex
CREATE INDEX "showtimes_room_id_start_time_idx" ON "showtimes"("room_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "showtimes_room_id_start_time_key" ON "showtimes"("room_id", "start_time");

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_event_id_fkey" FOREIGN KEY ("movie_event_id") REFERENCES "movie_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "food_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
