import { activeChat } from "@/app/core/activeChat";
import storage from "@/app/core/technical";
import { getServerUrl } from "@/app/core/serverUrl";
import Constants from "expo-constants";
import { socketContext } from "@/app/providers/socket-provider";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useContext, useEffect, useRef } from "react";
import { Platform } from "react-native";


const useNotifications = () => {
    const socket = useContext(socketContext);
    const tokenSent = useRef(false);

    // Request permissions and register push token with backend
    useEffect(() => {
        if (Platform.OS === "web" || tokenSent.current) return;

        (async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") return;

            try {
                const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
                if (!projectId) return;
                const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });

                const authToken = await storage.getItem("token");
                const userStr = await storage.getItem("user");
                if (!authToken || !userStr) return;

                const user = JSON.parse(userStr) as { id: number };
                await fetch(
                    `${await getServerUrl()}/api/users/pushToken`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userId: user.id,
                            pushToken: pushToken.data,
                        }),
                    }
                );
                tokenSent.current = true;
            } catch {
                // Firebase not configured or network error — local notifications still work
            }
        })();
    }, []);

    // Navigate to the right chat when user taps a notification
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data as {
                    senderId?: string;
                    senderName?: string;
                    recipientId?: string;
                };
                if (data.senderId && data.recipientId) {
                    router.push({
                        pathname: "/chat/[id]/[friendId]",
                        params: {
                            id: data.recipientId,
                            friendId: data.senderId,
                            username: data.senderName ?? "",
                        },
                    });
                }
            }
        );
        return () => sub.remove();
    }, []);

    // Show local notification for incoming messages when not in that chat
    useEffect(() => {
        if (!socket) return;

        const handler = async (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string) as {
                    type: string;
                    payload: Record<string, unknown>;
                };
                if (msg.type !== "message") return;

                const incoming = msg.payload.message as {
                    user_id: number;
                    username: string;
                    content: string;
                };

                const userStr = await storage.getItem("user");
                if (!userStr) return;

                const currentUser = JSON.parse(userStr) as { id: number };

                // Skip our own echoed messages
                if (incoming.user_id === currentUser.id) return;

                // Skip if the user is already viewing this conversation
                if (String(incoming.user_id) === activeChat.friendId) return;

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `💬 ${incoming.username}`,
                        body: incoming.content,
                        data: {
                            senderId: String(incoming.user_id),
                            senderName: incoming.username,
                            recipientId: String(currentUser.id),
                        },
                    },
                    trigger: null,
                });
            } catch {}
        };

        socket.addEventListener("message", handler);
        return () => socket.removeEventListener("message", handler);
    }, [socket]);
};

export default useNotifications;
