import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import userModel from "./model.js";

const userController = {
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const users = await userModel.getAll();

      if (!users) {
        return res.status(404).json({ error: "No users found" });
      }
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: `Failed to get users: ${error}` });
    }
  },
};

export default userController;