import { ThemedText } from "@/components/themed-text";
import FriendTable from "@/components/ui/friend-table";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import useGetUsers from "@/hooks/useGetUsers";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import storage from "./core/technical";
import { useCallback } from "react";

const FriendList = () => {
    const { users, currentUserId } = useGetUsers();
    const { unreadFriendIds } = useUnreadMessages();
    const logout = useCallback(async () => {
        await Promise.all([
            storage.removeItem('token'),
            storage.removeItem('user'),
        ]);
        router.replace("/");
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={logout}>
                    <Ionicons name="arrow-back" size={20} color="#FF69B4" />
                </Pressable>
                <View style={styles.titleContainer}>
                    <ThemedText style={styles.title}>✨ Mes Amis ✨</ThemedText>
                    <ThemedText style={styles.subtitle}>Choisis quelqu un pour discuter !</ThemedText>
                </View>
                <View style={styles.placeholder} />
            </View>
            <FriendTable users={users} currentUserId={currentUserId} unreadFriendIds={unreadFriendIds} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFE4F3",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: "#FF69B4",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#FF1493",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    backButton: {
        backgroundColor: "#FFFFFF",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF1493",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    titleContainer: {
        alignItems: "center",
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FFFFFF",
        textShadowColor: "rgba(255, 255, 255, 0.3)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 13,
        color: "#FFE4F3",
        marginTop: 4,
        fontWeight: "500",
    },
    placeholder: {
        width: 40,
    },
});

export default FriendList;
