-- GO International BD
-- 0009: Add optional image support to notices (Notice Board JPG popup)

ALTER TABLE notices ADD COLUMN image_url TEXT;
