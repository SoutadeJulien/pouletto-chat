import { User } from "@/types/users";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import storage from "../core/technical";
import { getServerUrl } from "../core/serverUrl";

export const socketContext = createContext<WebSocket | null>(null);
export const socketReconnectContext = createContext<() => void>(() => {});

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const appState = useRef(AppState.currentState);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intentionalClose = useRef(false);

    // Function to send disconnect message
    const sendDisconnect = async () => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;

        try {
            const userStr = await storage.getItem('user');
            if (!userStr) return; // No user logged in

            const currentUser: User = JSON.parse(userStr);
            if (!currentUser.id) return; // No valid user ID

            socketRef.current.send(JSON.stringify({
                type: 'handleLogin',
                payload: {
                    currentUserId: currentUser.id,
                    isConnected: false,
                }
            }));
        } catch (error) {
            console.error('Error sending disconnect:', error);
        }
    };

    // Function to send connect message
    const sendConnect = async () => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;

        try {
            const userStr = await storage.getItem('user');
            const token = await storage.getItem('token');
            if (!userStr || !token) return; // No user logged in

            const currentUser: User = JSON.parse(userStr);
            if (!currentUser.id) return; // No valid user ID

            socketRef.current.send(JSON.stringify({
                type: 'handleLogin',
                payload: {
                    currentUserId: currentUser.id,
                    isConnected: true,
                    token: token
                }
            }));
        } catch (error) {
            console.error('Error sending connect:', error);
        }
    };

    const connect = useCallback(async () => {
        const backendUrl = (await getServerUrl()) || 'http://localhost:3737';
        const wsUrl = backendUrl.replace(/^http/, 'ws');
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = async () => {
            console.log('Connected to server');
            await sendConnect(); // best-effort: no-op if no user in storage yet (pre-login)
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            console.log('Message from server:', event.data);
        };

        ws.onclose = () => {
            console.log('Socket closed');
            setSocket(null);
            if (!intentionalClose.current) {
                // Reconnect after 3 seconds on unexpected close
                reconnectTimerRef.current = setTimeout(() => connect(), 3000);
            }
        };

        ws.onerror = (event) => {
            console.log('Error:', event);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const reconnect = useCallback(() => {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        intentionalClose.current = true;
        if (socketRef.current) {
            socketRef.current.onclose = null;
            socketRef.current.close();
        }
        intentionalClose.current = false;
        connect();
    }, [connect]);

    useEffect(() => {
        intentionalClose.current = false;
        connect();

        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
                console.log('App going to background, sending disconnect...');
                sendDisconnect();
            } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App coming to foreground, sending connect...');
                sendConnect();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            intentionalClose.current = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            subscription.remove();
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }
        };
    }, [connect]);

    return (
        <socketContext.Provider value={socket}>
            <socketReconnectContext.Provider value={reconnect}>
                {children}
            </socketReconnectContext.Provider>
        </socketContext.Provider>
    );
};

export default SocketProvider;