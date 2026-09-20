-- GO International BD
-- 0010: User Account Center — visa/medical/flight status, notifications,
-- saved CV data, and per-user notification/language preferences.

-- One row per user tracking their visa/medical/flight processing status.
-- application_id is kept nullable and unused by today's UI (status is
-- tracked per-user, not per-application) but reserved for future use.
CREATE TABLE IF NOT EXISTS visa_statuses (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  application_id  TEXT REFERENCES applications(id) ON DELETE SET NULL,
  medical_status  TEXT NOT NULL DEFAULT 'not_started',
  visa_status     TEXT NOT NULL DEFAULT 'not_started',
  flight_status   TEXT NOT NULL DEFAULT 'not_scheduled',
  flight_date     TEXT NOT NULL DEFAULT '',
  flight_airline  TEXT NOT NULL DEFAULT '',
  flight_pnr      TEXT NOT NULL DEFAULT '',
  remarks         TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visa_statuses_user ON visa_statuses(user_id);

-- Per-user notifications (sent by admin, manually or automatically on a
-- status change).
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'general',
  link        TEXT,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  read_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- One saved CV per user (the CV Builder is otherwise fully client-side).
CREATE TABLE IF NOT EXISTS user_cvs (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data        TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Per-user notification preferences + language preference (Account Settings).
ALTER TABLE users ADD COLUMN notify_application INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_visa INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_medical INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_general INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN language_pref TEXT NOT NULL DEFAULT 'bn';
