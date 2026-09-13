-- GO International BD
-- User OTP + Optional Email + Password Recovery

PRAGMA foreign_keys = OFF;

-- Recreate users table so email can be optional

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,

  name TEXT NOT NULL DEFAULT '',

  email TEXT UNIQUE,

  phone TEXT NOT NULL UNIQUE,

  password_hash TEXT NOT NULL,

  profile_photo_key TEXT NOT NULL DEFAULT '',

  passport_number TEXT NOT NULL DEFAULT '',
  passport_issue TEXT NOT NULL DEFAULT '',
  passport_expiry TEXT NOT NULL DEFAULT '',

  status TEXT NOT NULL DEFAULT 'active',

  phone_verified INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (
  id,
  name,
  email,
  phone,
  password_hash,
  profile_photo_key,
  passport_number,
  passport_issue,
  passport_expiry,
  status,
  phone_verified,
  created_at,
  updated_at
)
SELECT
  id,
  name,
  NULLIF(email, ''),
  phone,
  password_hash,
  profile_photo_key,
  passport_number,
  passport_issue,
  passport_expiry,
  status,
  0,
  created_at,
  updated_at
FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_phone
  ON users(phone);

CREATE INDEX IF NOT EXISTS idx_users_status
  ON users(status);


-- OTP records

CREATE TABLE IF NOT EXISTS user_otps (
  id TEXT PRIMARY KEY,

  user_id TEXT,

  phone TEXT NOT NULL,

  otp_hash TEXT NOT NULL,

  purpose TEXT NOT NULL,
  -- register | reset_password

  expires_at TEXT NOT NULL,

  attempts INTEGER NOT NULL DEFAULT 0,

  used INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_otps_phone
  ON user_otps(phone);

CREATE INDEX IF NOT EXISTS idx_user_otps_purpose
  ON user_otps(purpose);

CREATE INDEX IF NOT EXISTS idx_user_otps_expires
  ON user_otps(expires_at);

PRAGMA foreign_keys = ON;