-- GO International BD
-- 0008: Fix chat schema drift
--   1) chat_conversations.user_id was left NOT NULL UNIQUE in production,
--      blocking every guest (non-logged-in) conversation. Make it nullable
--      again with a proper CHECK so exactly one of user_id/visitor_id is set.
--   2) Widen chat_conversations.status CHECK to include 'archived'
--      (already modeled in app code, never enforced in the live schema).
--   3) Widen chat_messages.sender_type CHECK to include 'ai'
--      (already modeled in app code, never enforced in the live schema).
-- chat_messages.is_read is already a single correct column; left unchanged.

PRAGMA foreign_keys = OFF;

CREATE TABLE chat_conversations_new (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  visitor_id TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'archived')),
  ai_enabled INTEGER NOT NULL DEFAULT 1
    CHECK (ai_enabled IN (0, 1)),
  user_deleted_at TEXT,
  admin_deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (
    (user_id IS NOT NULL AND visitor_id IS NULL)
    OR
    (user_id IS NULL AND visitor_id IS NOT NULL)
  )
);

INSERT INTO chat_conversations_new (
  id, user_id, visitor_id, status, ai_enabled,
  user_deleted_at, admin_deleted_at, created_at, updated_at
)
SELECT
  id, user_id, visitor_id, status, ai_enabled,
  user_deleted_at, admin_deleted_at, created_at, updated_at
FROM chat_conversations;

DROP TABLE chat_conversations;

ALTER TABLE chat_conversations_new RENAME TO chat_conversations;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conversations_user
  ON chat_conversations(user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conversations_visitor
  ON chat_conversations(visitor_id)
  WHERE visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated
  ON chat_conversations(updated_at);

CREATE TABLE chat_messages_new (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_type TEXT NOT NULL
    CHECK (sender_type IN ('user', 'admin', 'ai')),
  sender_user_id TEXT,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0
    CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attachment_key TEXT,
  attachment_name TEXT,
  attachment_mime TEXT,
  attachment_size INTEGER,
  attachment_kind TEXT,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO chat_messages_new (
  id, conversation_id, sender_type, sender_user_id, message,
  is_read, created_at,
  attachment_key, attachment_name, attachment_mime, attachment_size, attachment_kind
)
SELECT
  id, conversation_id, sender_type, sender_user_id, message,
  is_read, created_at,
  attachment_key, attachment_name, attachment_mime, attachment_size, attachment_kind
FROM chat_messages;

DROP TABLE chat_messages;

ALTER TABLE chat_messages_new RENAME TO chat_messages;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON chat_messages(conversation_id, sender_type, is_read);

CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment
  ON chat_messages(conversation_id, attachment_key);

PRAGMA foreign_keys = ON;
