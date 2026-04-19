import { activeChat } from "@/app/core/activeChat";
import storage from "@/app/core/technical";
import { getServerUrl } from "@/app/core/serverUrl";
import { socketContext } from "@/app/providers/socket-provider";
import { useCallback, useContext, useEffect, useState } from "react";

export const useUnreadMessages = () => {
    const socket = useContext(socketContext);
    const [unreadFriendIds, setUnreadFriendIds] = useState<Set<number>>(new Set());

    // Load unread senders from DB on mount
    useEffect(() => {
        (async () => {
            const token = await storage.getItem("token");
            const userStr = await storage.getItem("user");
            if (!token || !userStr) return;
            const currentUser = JSON.parse(userStr) as { id: number };
            const response = await fetch(
                `${await getServerUrl()}/api/messages/unread`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: currentUser.id }),
                }
            );
            if (!response.ok) return;
            const senderIds = (await response.json()) as number[];
            setUnreadFriendIds(prev => new Set([...prev, ...senderIds]));
        })();
    }, []);

    const clearUnread = useCallback((friendId: number) => {
        setUnreadFriendIds((prev) => {
            const next = new Set(prev);
            next.delete(friendId);
            return next;
        });
    }, []);

    // Register clearUnread on the singleton so the chat screen can call it
    useEffect(() => {
        activeChat.clearUnread = clearUnread;
        return () => {
            activeChat.clearUnread = null;
        };
    }, [clearUnread]);

    // Listen for new incoming messages and badge in real time
    useEffect(() => {
        if (!socket) return;

        const handler = async (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string) as {
                    type: string;
                    payload: Record<string, unknown>;
                };
                if (msg.type !== "message") return;

                const incoming = msg.payload.message as { user_id: number };

                const userStr = await storage.getItem("user");
                if (!userStr) return;
                const currentUser = JSON.parse(userStr) as { id: number };

                // Skip echoes of own messages
                if (incoming.user_id === currentUser.id) return;

                // Don't badge if already viewing this chat
                if (String(incoming.user_id) === activeChat.friendId) return;

                setUnreadFriendIds((prev) => new Set(prev).add(incoming.user_id));
            } catch {}
        };

        socket.addEventListener("message", handler);
        return () => socket.removeEventListener("message", handler);
    }, [socket]);

    return { unreadFriendIds, clearUnread };
};
