import { WebSocket, WebSocketServer } from "ws";
import { sendPushNotification } from "../fcm.js";
import userModel from "../users/model.js";
import chatModel from "./model.js";

interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  username?: string;
  isAlive?: boolean;
}

export function setupWebSocket(wss: WebSocketServer) {
  function broadcastUserStatusChanged(userId: number, username: string, isConnected: boolean) {
    const msg = JSON.stringify({
      type: "userStatusChanged",
      payload: { id: userId, username, is_connected: isConnected },
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  wss.on("connection", (ws: AuthenticatedSocket) => {
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (rawData) => {
      try {
        const data = JSON.parse(rawData.toString());

        switch (data.type) {
          case "handleLogin": {
            const { currentUserId, isConnected } = data.payload;
            const user = await userModel.findById(currentUserId);
            if (!user) {
              ws.send(JSON.stringify({ type: "error", payload: "User not found" }));
              return;
            }
            await userModel.updateIsConnected(user.id, isConnected);
            ws.userId = user.id;
            ws.username = user.username;
            ws.send(JSON.stringify({ type: "userConnected", payload: { id: user.id, username: user.username } }));
            broadcastUserStatusChanged(user.id, user.username, isConnected);
            break;
          }

          case "message": {
            const { content, friendId, type: msgType } = data.payload;
            if (!ws.userId) {
              ws.send(JSON.stringify({ type: "error", payload: "Not authenticated" }));
              return;
            }
            const saved = await chatModel.create(ws.userId, ws.username!, Number(friendId), content, msgType === 'gif' ? 'gif' : 'text');
            const outgoing = JSON.stringify({ type: "message", payload: { message: saved } });

            // Echo back to sender
            ws.send(outgoing);

            // Forward only to the intended recipient
            wss.clients.forEach((client) => {
              const authed = client as AuthenticatedSocket;
              if (authed !== ws && authed.readyState === WebSocket.OPEN && authed.userId === Number(friendId)) {
                authed.send(outgoing);
              }
            });

            // Push notification to recipient if offline
            const recipient = await userModel.getOfflineUserPushToken(Number(friendId));
            if (recipient?.push_token) {
              sendPushNotification({
                token: recipient.push_token,
                title: `💬 ${saved.username}`,
                body: saved.type === 'gif' ? '🎞️ a envoyé un GIF' : saved.content,
                data: {
                  senderId: String(saved.user_id),
                  senderName: saved.username,
                  recipientId: String(friendId),
                },
              }).catch((err: unknown) => console.error("Push notification failed:", err));
            }
            break;
          }

          case "typing": {
            const { friendId: typingFriendId, isTyping } = data.payload;
            if (!ws.userId) break;
            const outgoing = JSON.stringify({ type: "typing", payload: { userId: ws.userId, isTyping } });
            wss.clients.forEach((client) => {
              const authed = client as AuthenticatedSocket;
              if (authed !== ws && authed.readyState === WebSocket.OPEN && authed.userId === Number(typingFriendId)) {
                authed.send(outgoing);
              }
            });
            break;
          }

          case "messageRead": {
            const { friendId: readFriendId } = data.payload;
            if (!ws.userId) break;
            const outgoing = JSON.stringify({ type: "messageRead", payload: { readerId: ws.userId } });
            wss.clients.forEach((client) => {
              const authed = client as AuthenticatedSocket;
              if (authed !== ws && authed.readyState === WebSocket.OPEN && authed.userId === Number(readFriendId)) {
                authed.send(outgoing);
              }
            });
            break;
          }

          default:
            ws.send(JSON.stringify({ type: "error", payload: "Unknown message type" }));
        }
      } catch (error) {
        console.error("[WebSocket] Error handling message:", error);
        ws.send(JSON.stringify({ type: "error", payload: `Invalid message format: ${error}` }));
      }
    });

    ws.on("close", async () => {
      if (ws.userId) {
        await userModel.updateIsConnected(ws.userId, false);
        const user = await userModel.findById(ws.userId);
        if (user) {
          broadcastUserStatusChanged(user.id, user.username, false);
        }
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Heartbeat to detect stale connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedSocket) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });
}
