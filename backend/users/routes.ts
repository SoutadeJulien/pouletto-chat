import { Router, Response } from "express";
import userController from "./controller.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import userModel from "./model.js";

const usersRouter = Router();

usersRouter.post("/getAll", authMiddleware, (req: AuthRequest, res: Response) => {
  userController.getAll(req, res);
});

usersRouter.post("/pushToken", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { userId, pushToken } = req.body;
  await userModel.updatePushToken(userId, pushToken);
  res.json({ ok: true });
});

export default usersRouter;
