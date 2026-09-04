-- A parking space can be booked again after its previous ticket is used or expired.
DROP INDEX IF EXISTS "parking_tickets_parking_id_space_number_date_key";
CREATE INDEX IF NOT EXISTS "parking_tickets_parking_id_space_number_date_idx"
  ON "parking_tickets" ("parking_id", "space_number", "date");
