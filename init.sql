CREATE DATABASE IF NOT EXISTS `pouletto-chat`;
USE `pouletto-chat`;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  is_connected BOOLEAN DEFAULT FALSE,
  push_token TEXT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  username VARCHAR(255),
  friend_id INT NOT NULL,
  content TEXT NOT NULL,
  type ENUM('text', 'gif') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (friend_id) REFERENCES users(id)
);
