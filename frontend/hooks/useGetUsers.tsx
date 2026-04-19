import storage from '@/app/core/technical';
import { getServerUrl } from '@/app/core/serverUrl';
import { socketContext } from '@/app/providers/socket-provider';
import { assertIsUsers, User } from '@/types/users';
import { useContext, useEffect, useState } from "react";
import useErrorModal from './useErrorModal';

const useGetUsers = () => {
    const { showError } = useErrorModal();
    const [users, setUsers] = useState<User[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const socket = useContext(socketContext);

    useEffect(() => {
        if (!socket) return;

        let cancelled = false;

        const listenToUsers = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data as string) as { type: string; payload: { id: number; username: string; is_connected: boolean } };
                if (message.type === 'userStatusChanged') {
                    const { id, username, is_connected } = message.payload;
                    setUsers(prev => prev.map(u => u.id === id ? { ...u, username, isConnected: is_connected } : u));
                }
            } catch {
                // Malformed socket message — ignore
            }
        };

        (async () => {
            try {
                const userStr = await storage.getItem('user');
                const token = await storage.getItem('token');

                if (cancelled) return;
                if (!userStr || !token) {
                    console.log('No user or token found');
                    return;
                }

                const currentUser: User = JSON.parse(userStr);
                if (!currentUser.id) {
                    console.log('No valid user ID');
                    return;
                }

                setCurrentUserId(currentUser.id);

                // Send handleLogin to guarantee is_connected is set in the DB
                // before calling getAll — the socket may have opened before login.
                await new Promise<void>((resolve) => {
                    const handler = (event: MessageEvent) => {
                        try {
                            const msg = JSON.parse(event.data as string) as { type: string };
                            if (msg.type === 'userConnected') {
                                clearTimeout(timeout);
                                socket.removeEventListener('message', handler);
                                resolve();
                            }
                        } catch {}
                    };
                    const timeout = setTimeout(() => {
                        socket.removeEventListener('message', handler);
                        resolve();
                    }, 2000);
                    socket.addEventListener('message', handler);
                    socket.send(JSON.stringify({
                        type: 'handleLogin',
                        payload: { currentUserId: currentUser.id, isConnected: true, token },
                    }));
                });

                if (cancelled) return;

                const serverUrl = await getServerUrl();
                const getAllUrl = `${serverUrl}/api/users/getAll`;
                console.log('[useGetUsers] fetching', getAllUrl, 'token:', token?.slice(0, 20));
                const response = await fetch(getAllUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                    body: JSON.stringify({ currentUserId: currentUser.id }),
                });

                if (cancelled) return;

                console.log('[useGetUsers] response status:', response.status);
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Failed to fetch users (${response.status}): ${errText}`);
                }

                const data = await response.json();
                if (!assertIsUsers(data)) {
                    throw new Error('Invalid user data');
                }

                // Map is_connected (API snake_case) → isConnected (frontend camelCase)
                const mapped = data.map((u: User & { is_connected?: boolean }) => ({
                    ...u,
                    isConnected: u.is_connected ?? false,
                }));

                if (!cancelled) {
                    setUsers(mapped.filter((u: User) => u.id !== currentUser.id));
                    socket.addEventListener('message', listenToUsers);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Error fetching users:', error);
                    showError(`Erreur lors de la récupération des utilisateurs: ${error}`);
                }
            }
        })();

        return () => {
            cancelled = true;
            socket.removeEventListener('message', listenToUsers);
        };
    }, [socket, showError]);

    return { users, currentUserId };
};

export default useGetUsers;
