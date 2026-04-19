import storage from "@/app/core/technical";
import { getServerUrl } from "@/app/core/serverUrl";
import { socketContext } from "@/app/providers/socket-provider";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import useErrorModal from "./useErrorModal";
import useSendSocket from "./useSendSocket";

export interface Message {
    id: number;
    content: string;
    type?: 'text' | 'gif';
    created_at: string;
    user_id: number;
    friend_id: number;
    username: string;
    read_at?: string | null;
    pending?: boolean;
    tempId?: string;
}

interface QueuedMessage {
    tempId: string;
    content: string;
    type?: 'text' | 'gif';
    userId: string;
    friendId: string;
    created_at: string;
}

const QUEUE_KEY = "offline_message_queue";
const PAGE_SIZE = 20;

const readQueue = async (): Promise<QueuedMessage[]> => {
    const json = await storage.getItem(QUEUE_KEY);
    return json ? (JSON.parse(json) as QueuedMessage[]) : [];
};

const writeQueue = async (queue: QueuedMessage[]): Promise<void> => {
    await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const useChat = (userId: string, friendId: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isFriendTyping, setIsFriendTyping] = useState(false);

    const socket = useContext(socketContext);
    const { send, isConnected } = useSendSocket();
    const { showError } = useErrorModal();

    const isLoadingMoreRef = useRef(false);
    const myTypingRef = useRef(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const friendTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchMessages = useCallback(
        async (pageNum: number, reset = false) => {
            if (isLoadingMoreRef.current && !reset) return;
            isLoadingMoreRef.current = true;
            setIsLoadingMore(true);

            try {
                const token = await storage.getItem("token");
                if (!token) return;

                const serverUrl = await getServerUrl();
                console.log('[useChat] fetchMessages', { userId, friendId, pageNum, serverUrl });
                const response = await fetch(
                    `${serverUrl}/api/messages/getAll`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ userId, friendId, page: pageNum, limit: PAGE_SIZE }),
                    }
                );

                console.log('[useChat] response status:', response.status);
                if (!response.ok) throw new Error(`Failed to fetch messages (${response.status})`);
                const data = (await response.json()) as Message[];
                console.log('[useChat] messages count:', data.length);

                setHasMore(data.length === PAGE_SIZE);
                if (reset) {
                    setMessages(data);
                } else {
                    setMessages((prev) => [...data, ...prev]);
                }
                setPage(pageNum);
            } catch (error) {
                showError(`Erreur lors de la récupération des messages: ${error}`);
            } finally {
                isLoadingMoreRef.current = false;
                setIsLoadingMore(false);
            }
        },
        [userId, friendId, showError]
    );

    // Initial fetch + restore persisted pending messages
    useEffect(() => {
        fetchMessages(1, true);

        readQueue().then((queue) => {
            const myPending = queue
                .filter((q) => q.userId === userId && q.friendId === friendId)
                .map((q) => ({
                    id: -(parseInt(q.tempId.replace("temp_", ""), 10) || Date.now()),
                    content: q.content,
                    type: q.type ?? ('text' as const),
                    created_at: q.created_at,
                    user_id: Number(userId),
                    friend_id: Number(friendId),
                    username: "Moi",
                    tempId: q.tempId,
                    pending: true as const,
                }));
            setPendingMessages(myPending);
        });
    }, [userId, friendId]);

    const loadOlderMessages = useCallback(() => {
        if (!hasMore || isLoadingMoreRef.current) return;
        fetchMessages(page + 1);
    }, [hasMore, page, fetchMessages]);

    // Flush pending queue on reconnect
    useEffect(() => {
        if (!isConnected) return;

        readQueue().then(async (queue) => {
            const myQueue = queue.filter(
                (q) => q.userId === userId && q.friendId === friendId
            );
            if (myQueue.length === 0) return;

            const otherQueue = queue.filter(
                (q) => !(q.userId === userId && q.friendId === friendId)
            );
            const failed: QueuedMessage[] = [];
            const succeededIds = new Set<string>();

            for (const queued of myQueue) {
                const success = send("message", {
                    content: queued.content,
                    userId: queued.userId,
                    type: queued.type ?? 'text',
                });
                if (success) succeededIds.add(queued.tempId);
                else failed.push(queued);
            }

            await writeQueue([...otherQueue, ...failed]);

            if (succeededIds.size > 0) {
                setPendingMessages((prev) =>
                    prev.filter((m) => m.tempId && !succeededIds.has(m.tempId))
                );
            }
        });
    }, [isConnected, userId, friendId, send]);

    // Listen to socket events
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            const msg = JSON.parse(event.data as string) as {
                type: string;
                payload: Record<string, unknown>;
            };

            if (msg.type === "message") {
                const incoming = msg.payload.message as Message;
                const isFromMe = incoming.user_id === Number(userId);
                const isFromFriend = incoming.user_id === Number(friendId);

                // If this is our own message echoed back, remove the matching pending bubble
                // and preserve its type in case the server doesn't return it
                if (isFromMe) {
                    setPendingMessages((prev) => {
                        const idx = prev.findIndex((m) => m.content === incoming.content);
                        if (idx === -1) return prev;
                        if (!incoming.type && prev[idx].type) {
                            incoming.type = prev[idx].type;
                        }
                        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
                    });
                }
                setMessages((prev) => [...prev, incoming]);
            }

            if (msg.type === "typing") {
                const payload = msg.payload as { userId: string; isTyping: boolean };
                if (String(payload.userId) === friendId) {
                    setIsFriendTyping(payload.isTyping);
                    if (friendTypingTimeoutRef.current) clearTimeout(friendTypingTimeoutRef.current);
                    if (payload.isTyping) {
                        friendTypingTimeoutRef.current = setTimeout(
                            () => setIsFriendTyping(false),
                            3000
                        );
                    }
                }
            }

            if (msg.type === "messageRead") {
                const payload = msg.payload as { readerId: string };
                if (String(payload.readerId) === friendId) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.user_id === Number(userId) && !m.read_at
                                ? { ...m, read_at: new Date().toISOString() }
                                : m
                        )
                    );
                }
            }
        };

        socket.addEventListener("message", handleMessage);
        return () => socket.removeEventListener("message", handleMessage);
    }, [socket, userId, friendId, send]);

    // Stop typing on unmount (local cleanup only — not sent to server)
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (friendTypingTimeoutRef.current) clearTimeout(friendTypingTimeoutRef.current);
            myTypingRef.current = false;
        };
    }, []);

    const handleTyping = useCallback(() => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            myTypingRef.current = false;
        }, 2000);
    }, [send, userId, friendId]);

    const sendMessage = useCallback(
        (content: string, type: 'text' | 'gif' = 'text'): boolean => {
            const tempId = `temp_${Date.now()}`;
            const pendingMsg: Message = {
                id: -Date.now(),
                content,
                type,
                created_at: new Date().toISOString(),
                user_id: Number(userId),
                friend_id: Number(friendId),
                username: "Moi",
                tempId,
                pending: true,
            };

            const success = send("message", { content, userId, friendId, type });

            // Stop typing indicator on send
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (myTypingRef.current) {
                send("typing", { userId, friendId, isTyping: false });
                myTypingRef.current = false;
            }

            // Always show the message optimistically — if offline, queue it
            setPendingMessages((prev) => [...prev, pendingMsg]);

            if (!success) {
                readQueue()
                    .then((queue) => {
                        queue.push({ tempId, content, type, userId, friendId, created_at: pendingMsg.created_at });
                        return writeQueue(queue);
                    })
                    .catch((err) => console.error('Failed to persist offline queue:', err));
            }

            return success;
        },
        [send, friendId, userId]
    );

    return {
        messages,
        pendingMessages,
        sendMessage,
        loadOlderMessages,
        hasMore,
        isLoadingMore,
        isFriendTyping,
        handleTyping,
    };
};
