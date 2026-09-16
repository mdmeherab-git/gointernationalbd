-- GO International BD
-- 0005: Office Chat + AI Assistant foundation

CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  visitor_id TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'archived', 'closed')),
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conversations_user
  ON chat_conversations(user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conversations_visitor
  ON chat_conversations(visitor_id)
  WHERE visitor_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_type TEXT NOT NULL
    CHECK (sender_type IN ('user', 'admin', 'ai')),
  sender_user_id TEXT,
  message TEXT NOT NULL,
  is_read_by_user INTEGER NOT NULL DEFAULT 0
    CHECK (is_read_by_user IN (0, 1)),
  is_read_by_admin INTEGER NOT NULL DEFAULT 0
    CHECK (is_read_by_admin IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_admin_unread
  ON chat_messages(conversation_id, sender_type, is_read_by_admin);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_unread
  ON chat_messages(conversation_id, sender_type, is_read_by_user);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated
  ON chat_conversations(updated_at);
