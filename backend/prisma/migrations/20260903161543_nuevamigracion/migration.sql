/*
  Warnings:

  - You are about to drop the column `available_seats` on the `showtimes` table. All the data in the column will be lost.
  - You are about to drop the column `movie_id` on the `showtimes` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `showtimes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[room_id,start_time]` on the table `showtimes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `movie_event_id` to the `showtimes` table without a default value. This is not possible if the table is not empty.

  Note: the CreateEnum "FoodCategory", the food_products/reservation_items tables and
  their indexes/foreign keys, and the movie_events "ageRating" column were removed
  from this migration because migration 20260903100000_add_food_and_event_fields
  (brought in from main) already creates them under the correct snake_case names.

*/
-- DropForeignKey
ALTER TABLE "showtimes" DROP CONSTRAINT "showtimes_movie_id_fkey";

-- DropIndex
DROP INDEX "showtimes_movie_id_idx";

-- DropIndex
DROP INDEX "showtimes_movie_id_room_id_start_time_key";

-- DropIndex
DROP INDEX "showtimes_start_time_idx";

-- AlterTable
ALTER TABLE "showtimes" DROP COLUMN "available_seats",
DROP COLUMN "movie_id",
DROP COLUMN "price",
ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "movie_event_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "showtimes_movie_event_id_start_time_idx" ON "showtimes"("movie_event_id", "start_time");

-- CreateIndex
CREATE INDEX "showtimes_room_id_start_time_idx" ON "showtimes"("room_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "showtimes_room_id_start_time_key" ON "showtimes"("room_id", "start_time");

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_event_id_fkey" FOREIGN KEY ("movie_event_id") REFERENCES "movie_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
