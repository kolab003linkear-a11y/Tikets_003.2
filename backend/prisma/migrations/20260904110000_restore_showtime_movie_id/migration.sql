-- Restore the Showtime relation expected by the current Prisma schema.
ALTER TABLE "showtimes" DROP CONSTRAINT IF EXISTS "showtimes_movie_event_id_fkey";

DROP INDEX IF EXISTS "showtimes_movie_event_id_start_time_idx";
DROP INDEX IF EXISTS "showtimes_room_id_start_time_idx";
DROP INDEX IF EXISTS "showtimes_room_id_start_time_key";

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'showtimes'
			AND column_name = 'movie_event_id'
	) AND NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'showtimes'
			AND column_name = 'movie_id'
	) THEN
		ALTER TABLE "showtimes" RENAME COLUMN "movie_event_id" TO "movie_id";
	END IF;
END $$;

DROP INDEX IF EXISTS "showtimes_movie_id_idx";
DROP INDEX IF EXISTS "showtimes_movie_id_room_id_start_time_key";
CREATE INDEX "showtimes_movie_id_idx" ON "showtimes"("movie_id");
CREATE UNIQUE INDEX "showtimes_movie_id_room_id_start_time_key" ON "showtimes"("movie_id", "room_id", "start_time");

ALTER TABLE "showtimes" DROP CONSTRAINT IF EXISTS "showtimes_movie_id_fkey";
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movie_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
