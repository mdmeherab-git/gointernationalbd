-- GO International BD
-- 0013: Optional pre-filled WhatsApp message for the chat-head WhatsApp button.
-- The app also adds this column on first use, so running this is optional.

ALTER TABLE site_settings ADD COLUMN contact_whatsapp_message TEXT NOT NULL DEFAULT '';
