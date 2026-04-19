import { pool } from "../db/config.js";
import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  id: number;
  username: string;
  push_token?: string;
}
const userModel = {
  getAll: async () => {
    try {
      const [rows] = await pool.execute("SELECT id, username, is_connected FROM users");
      return rows;
    } catch (error) {
      throw error;
    }
  },
  findByUsername: async (username: string) => {
    const [rows] = await pool.execute<User[]>(
      "SELECT id, username, password FROM users WHERE username = ?",
      [username]
    );
    return rows[0] || null;
  },
  findById: async (id: number) => {
    const [rows] = await pool.execute<User[]>(
      "SELECT id, username, password FROM users WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },
  updateIsConnected: async (userId: number, isConnected: boolean) => {
    try {
      await pool.execute("UPDATE users SET is_connected = ? WHERE id = ?", [isConnected, userId]);
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to update is connected: ${error}` };
    }
  },
  updatePushToken: async (userId: number, pushToken: string | null) => {
    await pool.execute("UPDATE users SET push_token = ? WHERE id = ?", [pushToken, userId]);
  },
  getOfflineUserPushToken: async (recipientId: number) => {
    const [rows] = await pool.execute<User[]>(
      "SELECT id, username, push_token FROM users WHERE id = ? AND is_connected = 0 AND push_token IS NOT NULL",
      [recipientId]
    );
    return rows[0] || null;
  },
};

export default userModel;
