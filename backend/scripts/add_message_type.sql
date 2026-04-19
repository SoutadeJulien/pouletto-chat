ALTER TABLE messages
ADD COLUMN type ENUM('text', 'gif') NOT NULL DEFAULT 'text';
