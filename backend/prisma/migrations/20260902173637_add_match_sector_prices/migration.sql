-- CreateTable
CREATE TABLE "match_sector_prices" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "sector_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_sector_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_sector_prices_match_id_sector_id_key" ON "match_sector_prices"("match_id", "sector_id");

-- AddForeignKey
ALTER TABLE "match_sector_prices" ADD CONSTRAINT "match_sector_prices_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_sector_prices" ADD CONSTRAINT "match_sector_prices_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "stadium_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
