-- GO International BD — User Account / Profile schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,

  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,

  password_hash TEXT NOT NULL,

  profile_photo_key TEXT NOT NULL DEFAULT '',

  passport_number TEXT NOT NULL DEFAULT '',
  passport_issue TEXT NOT NULL DEFAULT '',
  passport_expiry TEXT NOT NULL DEFAULT '',

  status TEXT NOT NULL DEFAULT 'active',

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_phone
  ON users(phone);

CREATE INDEX IF NOT EXISTS idx_users_status
  ON users(status);


-- User login sessions

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,

  user_id TEXT NOT NULL,

  expires_at TEXT NOT NULL,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
  ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
  ON user_sessions(expires_at);


-- User uploaded documents / CV / passport / medical etc.

CREATE TABLE IF NOT EXISTS user_documents (
  id TEXT PRIMARY KEY,

  user_id TEXT NOT NULL,

  document_type TEXT NOT NULL,

  file_name TEXT NOT NULL DEFAULT '',

  r2_key TEXT NOT NULL,

  content_type TEXT NOT NULL DEFAULT '',

  file_size INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user
  ON user_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_documents_type
  ON user_documents(document_type);


-- Connect job applications with registered users

ALTER TABLE applications
ADD COLUMN user_id TEXT;
  
CREATE INDEX IF NOT EXISTS idx_applications_user
  ON applications(user_id);