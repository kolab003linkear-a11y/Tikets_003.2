/*
  Warnings:

  - You are about to drop the column `away_team` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `home_team` on the `matches` table. All the data in the column will be lost.
  - Added the required column `away_team_id` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_team_id` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "bus_routes_origin_terminal_status_idx";

-- DropIndex
DROP INDEX "parking_lots_operator_status_idx";

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- Preserve legacy team names before replacing them with relations.
INSERT INTO "teams" ("id", "name", "updated_at")
SELECT 'team-' || md5("name"), "name", CURRENT_TIMESTAMP
FROM (
  SELECT "home_team" AS "name" FROM "matches"
  UNION
  SELECT "away_team" AS "name" FROM "matches"
) AS legacy_teams
WHERE "name" IS NOT NULL;

-- AlterTable
ALTER TABLE "matches"
ADD COLUMN "away_team_id" TEXT,
ADD COLUMN "home_team_id" TEXT;

UPDATE "matches" AS matches
SET "home_team_id" = 'team-' || md5(matches."home_team"),
    "away_team_id" = 'team-' || md5(matches."away_team");

ALTER TABLE "matches"
DROP COLUMN "away_team",
DROP COLUMN "home_team",
ALTER COLUMN "away_team_id" SET NOT NULL,
ALTER COLUMN "home_team_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "parking_lots" ALTER COLUMN "operator" DROP DEFAULT,
ALTER COLUMN "opening_hours" DROP DEFAULT,
ALTER COLUMN "vehicle_types" DROP DEFAULT;

-- AlterTable
ALTER TABLE "parking_tickets" ALTER COLUMN "entry_metadata" DROP DEFAULT;

-- CreateTable
CREATE TABLE "user_favorite_teams" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_teams_user_id_team_id_key" ON "user_favorite_teams"("user_id", "team_id");

-- CreateIndex
CREATE INDEX "matches_home_team_id_idx" ON "matches"("home_team_id");

-- CreateIndex
CREATE INDEX "matches_away_team_id_idx" ON "matches"("away_team_id");

-- AddForeignKey
ALTER TABLE "user_favorite_teams" ADD CONSTRAINT "user_favorite_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_teams" ADD CONSTRAINT "user_favorite_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
