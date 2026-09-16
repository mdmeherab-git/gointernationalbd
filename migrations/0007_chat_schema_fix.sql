-- GO International BD
-- 0007: Fix existing chat_conversations schema

ALTER TABLE chat_conversations
ADD COLUMN visitor_id TEXT;

ALTER TABLE chat_conversations
ADD COLUMN ai_enabled INTEGER NOT NULL DEFAULT 1;

ALTER TABLE chat_conversations
ADD COLUMN user_deleted_at TEXT;

ALTER TABLE chat_conversations
ADD COLUMN admin_deleted_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conversations_user
ON chat_conversations(user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_conversations_visitor
ON chat_conversations(visitor_id)
WHERE visitor_id IS NOT NULL;