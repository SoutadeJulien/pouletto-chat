ALTER TABLE messages
ADD COLUMN friend_id INT NOT NULL AFTER user_id,
ADD CONSTRAINT fk_messages_friend_id FOREIGN KEY (friend_id) REFERENCES users(id);
