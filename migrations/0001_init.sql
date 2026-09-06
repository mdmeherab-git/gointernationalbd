-- GO International BD — admin dashboard schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS circulars (
  id                 TEXT PRIMARY KEY,
  country            TEXT NOT NULL,
  country_code       TEXT NOT NULL DEFAULT '',
  flag               TEXT NOT NULL DEFAULT '',
  category           TEXT NOT NULL DEFAULT '',
  title              TEXT NOT NULL,
  sponsor            TEXT NOT NULL DEFAULT '',
  salary             TEXT NOT NULL DEFAULT '',
  vacancy            INTEGER NOT NULL DEFAULT 0,
  duty               TEXT NOT NULL DEFAULT '',
  accommodation      TEXT NOT NULL DEFAULT '',
  deadline           TEXT NOT NULL DEFAULT '',
  posted             TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  requirements        TEXT NOT NULL DEFAULT '[]',       -- JSON array of strings
  circular_url        TEXT,
  circular_type       TEXT,                             -- 'image' | 'pdf'
  is_featured         INTEGER NOT NULL DEFAULT 0,       -- 0 | 1
  featured_image_url  TEXT,
  status             TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'inactive'
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_circulars_status   ON circulars(status);
CREATE INDEX IF NOT EXISTS idx_circulars_featured ON circulars(is_featured);
CREATE INDEX IF NOT EXISTS idx_circulars_sort     ON circulars(sort_order);

CREATE TABLE IF NOT EXISTS notices (
  id            TEXT PRIMARY KEY,
  title_bn      TEXT NOT NULL,
  title_en      TEXT NOT NULL,
  notice_date   TEXT NOT NULL DEFAULT (date('now')),
  tag_type      TEXT NOT NULL DEFAULT 'general',        -- 'new' | 'general' | 'report'
  tag_label_bn  TEXT NOT NULL DEFAULT 'সাধারণ',
  tag_label_en  TEXT NOT NULL DEFAULT 'General',
  status        TEXT NOT NULL DEFAULT 'active',         -- 'active' | 'inactive'
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_sort   ON notices(sort_order);

CREATE TABLE IF NOT EXISTS applications (
  id             TEXT PRIMARY KEY,
  circular_id    TEXT,
  job_title      TEXT NOT NULL DEFAULT '',
  job_country    TEXT NOT NULL DEFAULT '',
  applicant_name TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT NOT NULL DEFAULT '',
  message        TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'new',           -- new | reviewing | shortlisted | rejected | hired
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_applications_status  ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at);

CREATE TABLE IF NOT EXISTS popular_countries (
  id         TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible    INTEGER NOT NULL DEFAULT 1                 -- 0 | 1
);
CREATE INDEX IF NOT EXISTS idx_popular_sort ON popular_countries(sort_order);

CREATE TABLE IF NOT EXISTS site_settings (
  id               TEXT PRIMARY KEY,                    -- always 'main'
  contact_phone    TEXT NOT NULL DEFAULT '',
  contact_whatsapp TEXT NOT NULL DEFAULT '',
  contact_email    TEXT NOT NULL DEFAULT '',
  office_address   TEXT NOT NULL DEFAULT '',
  notice_enabled   INTEGER NOT NULL DEFAULT 1,
  notice_bn        TEXT NOT NULL DEFAULT '',
  notice_en        TEXT NOT NULL DEFAULT '',
  notice_speed     INTEGER NOT NULL DEFAULT 25,
  notice_direction TEXT NOT NULL DEFAULT 'left',        -- 'left' | 'right'
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
