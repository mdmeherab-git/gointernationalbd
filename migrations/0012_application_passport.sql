-- GO International BD
-- 0012: Optional passport copy (PDF / JPG) attached to a job application.
-- The app also adds these columns on first use, so running this is optional.

ALTER TABLE applications ADD COLUMN passport_key  TEXT;
ALTER TABLE applications ADD COLUMN passport_name TEXT;
