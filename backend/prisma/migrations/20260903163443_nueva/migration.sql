-- AlterTable
ALTER TABLE "showtimes" ADD COLUMN     "available_seats" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 7;
