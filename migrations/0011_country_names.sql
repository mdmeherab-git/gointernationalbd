-- GO International BD
-- 0011: Admin-customised Bangla country names (the app also creates this
-- table on first use, so running this migration is optional).

CREATE TABLE IF NOT EXISTS country_names (
  code       TEXT PRIMARY KEY,
  name_bn    TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
