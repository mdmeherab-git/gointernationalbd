-- GO International BD
-- 0006: Chat attachment metadata

ALTER TABLE chat_messages ADD COLUMN attachment_key TEXT;
ALTER TABLE chat_messages ADD COLUMN attachment_name TEXT;
ALTER TABLE chat_messages ADD COLUMN attachment_mime TEXT;
ALTER TABLE chat_messages ADD COLUMN attachment_size INTEGER;
ALTER TABLE chat_messages ADD COLUMN attachment_kind TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment
  ON chat_messages(conversation_id, attachment_key);


