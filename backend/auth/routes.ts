import { Router, Request, Response } from "express";
import authController from "./controller.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const authRouter = Router();

authRouter.post("/login", (req: Request, res: Response) => {
  authController.login(req, res);
});

authRouter.get("/verify", authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ ok: true, user: req.user });
});

export default authRouter;

