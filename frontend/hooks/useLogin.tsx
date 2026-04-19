import storage from "@/app/core/technical";
import { getServerUrl } from "@/app/core/serverUrl";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import useErrorModal from "./useErrorModal";

export const useLogin = () => {
    const [username, setUsername] = useState('');
    const { showError, ErrorModalComponent } = useErrorModal();

    useEffect(() => {
        (async () => {
            try {
                const serverUrl = await getServerUrl();
                if (!serverUrl) {
                    router.replace('/setup');
                    return;
                }

                const token = await storage.getItem('token');
                if (!token) return;

                const backendUrl = await getServerUrl();
                const res = await fetch(`${backendUrl}/api/auth/verify`, {
                    signal: AbortSignal.timeout(4000),
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) router.replace('/friend-list');
                else await storage.removeItem('token');
            } catch {
                // backend unreachable — stay on login screen
            }
        })();
    }, []);

    const login = useCallback(async () => {
        if (username.trim() === '') {
            showError("Veuillez entrer un nom d'utilisateur");
            return;
        }

        const backendUrl = await getServerUrl();
        const loginUrl = `${backendUrl}/api/auth/login`;
        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                // 409 means the username is already taken / in use
                if (response.status === 409) {
                    showError(
                        `Le nom "${username.trim()}" est déjà utilisé. Choisissez un autre nom.`,
                        'Nom indisponible'
                    );
                } else {
                    showError(data.message || data.statusText || 'Erreur de connexion');
                }
                return;
            }

            if (data.success) {
                await storage.setItem('token', data.token);
                await storage.setItem('user', JSON.stringify(data.user));
                router.replace('/friend-list');
            } else {
                showError(data.message || data.statusText || "Nom d'utilisateur indisponible");
            }
        } catch (error) {
            console.error('Error logging in:', error);
            showError('Erreur réseau. Réessayez.');
        }
    }, [username, showError]);

    return { username, setUsername, login, ErrorModalComponent };
};
