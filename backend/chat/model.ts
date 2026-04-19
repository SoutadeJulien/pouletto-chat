import { pool } from "../db/config.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface Message extends RowDataPacket {
  id: number;
  user_id: number;
  friend_id: number;
  username: string;
  content: string;
  type: 'text' | 'gif';
  created_at: Date;
  read_at?: Date | null;
}

const chatModel = {
  getAll: async (userId: number, friendId: number, page: number, limit: number) => {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query<Message[]>(
      `SELECT m.id, m.user_id, m.friend_id, u.username, m.content, m.type, m.created_at
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE (m.user_id = ? AND m.friend_id = ?) OR (m.user_id = ? AND m.friend_id = ?)
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, friendId, friendId, userId, limit, offset]
    );
    return (rows as Message[]).reverse();
  },

  getUnreadSenders: async (userId: number): Promise<number[]> => {
    const [rows] = await pool.execute<(RowDataPacket & { user_id: number })[]>(
      `SELECT DISTINCT user_id FROM messages WHERE friend_id = ? AND read_at IS NULL`,
      [userId]
    );
    return rows.map((r) => r.user_id);
  },

  markRead: async (userId: number, friendId: number): Promise<void> => {
    await pool.execute(
      `UPDATE messages SET read_at = NOW() WHERE friend_id = ? AND user_id = ? AND read_at IS NULL`,
      [userId, friendId]
    );
  },

  create: async (userId: number, username: string, friendId: number, content: string, type: 'text' | 'gif' = 'text') => {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO messages (user_id, username, friend_id, content, type) VALUES (?, ?, ?, ?, ?)",
      [userId, username, friendId, content, type]
    );
    const [rows] = await pool.execute<Message[]>(
      `SELECT m.id, m.user_id, m.friend_id, u.username, m.content, m.type, m.created_at
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );
    return rows[0];
  },
};

export default chatModel;
