import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import chatModel from "./model.js";

const router = Router();

router.post("/getAll", authMiddleware, async (req, res) => {
    const { userId, friendId, page = 1, limit = 20 } = req.body;
    const messages = await chatModel.getAll(Number(userId), Number(friendId), Number(page), Number(limit));
    res.json(messages);
});

router.post("/unread", authMiddleware, async (req, res) => {
    const { userId } = req.body;
    const senderIds = await chatModel.getUnreadSenders(Number(userId));
    res.json(senderIds);
});

router.post("/markRead", authMiddleware, async (req, res) => {
    const { userId, friendId } = req.body;
    await chatModel.markRead(Number(userId), Number(friendId));
    res.json({ success: true });
});

export default router;
