import { useContext, useCallback } from "react";
import { socketContext } from "@/app/providers/socket-provider";

const useSendSocket = () => {
    const socket = useContext(socketContext);

    const send = useCallback((type: string, payload: any) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("Socket not connected");
            return false;
        }
        
        try {
            socket.send(JSON.stringify({ type, payload }));
            return true;
        } catch (error) {
            console.warn('Socket send failed:', error);
            return false;
        }
    }, [socket]);

    const isConnected = socket?.readyState === WebSocket.OPEN;

    return { send, isConnected };
};

export default useSendSocket;