import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { generateToken } from "../middleware/auth.js";
import userModel from "../users/model.js";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10");

const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { username } = req.body;

      if (!username ) {
        return res.status(400).json({ success: false, statusText: "Nom d'utilisateur et mot de passe sont requis" });
      }

      const user = await userModel.findByUsername(username);

      if (!user) {
        return res.status(401).json({ success: false, statusText: "Nom d'utilisateur incorrect" });
      }

      const token = generateToken({ id: user.id, username: user.username });
      res.status(200).json({
        success: true,
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: `Login failed: ${error}` });
    }
  },


  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },
};

export default authController;

