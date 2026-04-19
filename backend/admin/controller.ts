import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Request, Response } from "express";
import { pool } from "../db/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const adminController = {
  getPage: (_req: Request, res: Response) => {
    res.sendFile(join(__dirname, "admin.html"));
  },

  getUsers: async (_req: Request, res: Response) => {
    try {
      const [rows] = await pool.query("SELECT id, username FROM users ORDER BY username");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: `Failed to get users: ${error}` });
    }
  },

  createUser: async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: "username required" });
      await pool.query("INSERT INTO users (username) VALUES (?)", [username]);
      res.status(201).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: `Failed to create user: ${error}` });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM messages WHERE user_id = ? OR friend_id = ?", [id, id]);
      await pool.query("DELETE FROM users WHERE id = ?", [id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: `Failed to delete user: ${error}` });
    }
  },
};

export default adminController;
