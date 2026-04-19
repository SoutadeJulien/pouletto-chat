import { activeChat } from "@/app/core/activeChat";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Chat from "@/components/ui/chat";
import { ThemedText } from "@/components/themed-text";

export default function ChatScreen() {
    const { id, friendId, username } = useLocalSearchParams<{ id: string, friendId: string, username: string }>();

    useEffect(() => {
        activeChat.friendId = friendId;
        activeChat.clearUnread?.(Number(friendId));

        // Mark messages from this friend as read in DB
        (async () => {
            const [token, serverUrl] = await Promise.all([
                import("@/app/core/technical").then(m => m.default.getItem("token")),
                import("@/app/core/serverUrl").then(m => m.getServerUrl()),
            ]);
            if (!token) return;
            fetch(`${serverUrl}/api/messages/markRead`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id, friendId }),
            }).catch(() => {});
        })();

        return () => { activeChat.friendId = null; };
    }, [friendId, id]);

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color="#FF69B4" />
                </Pressable>
                <ThemedText style={styles.friendName}>{username}</ThemedText>
                <View style={styles.placeholder} />
            </View>
            <Chat userId={id} friendId={friendId} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFE4F3",
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        backgroundColor: "rgb(255, 128, 217)",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        backgroundColor: "#FFFFFF",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFB6D9",
        shadowColor: "#FF69B4",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    friendName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#D63384",
    },
    placeholder: {
        width: 40,
    },
});

