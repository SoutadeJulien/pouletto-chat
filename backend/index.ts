import cors from "cors";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import authRouter from "./auth/routes.js";
import chatRouter from "./chat/routes.js";
import { setupWebSocket } from "./chat/websocket.js";
import usersRouter from "./users/routes.js";
import adminRouter from "./admin/routes.js";

const app = express();
const corsOptions = {
    origin: true, // Allow all origins in development (Expo Go, etc.)
    credentials: true,
};
const server = http.createServer(app);

const wss = new WebSocketServer({ server });
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/messages", chatRouter);
app.use("/admin", adminRouter);
app.get("/api/health", (req, res) => {
    res.send("The server is up");
});
setupWebSocket(wss);

const PORT = Number(process.env.PORT) || 3737;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});
