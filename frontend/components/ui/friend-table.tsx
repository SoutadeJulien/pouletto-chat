import { User } from "@/types/users";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../themed-text";

const FriendTable = ({ users, currentUserId, unreadFriendIds }: { users: User[], currentUserId: number | null, unreadFriendIds: Set<number> }) => {
    const insets = useSafeAreaInsets();
    return (
        <>
            {users.length > 0 ? (
                <FlatList
                    data={users}
                    keyExtractor={(user) => user.id.toString()}
                    extraData={unreadFriendIds}
                    renderItem={({ item }) => (
                        <Pressable style={childStyles.friendCard} onPress={() => router.push({ pathname: "/chat/[id]/[friendId]", params: { id: currentUserId?.toString() ?? '0', friendId: item.id.toString(), username: item.username } })}>
                            <ThemedText style={item.isConnected ? childStyles.connectedFriend : childStyles.disconnectedFriend}>{item.username}</ThemedText>
                            {unreadFriendIds.has(item.id) && (
                                <View style={childStyles.unreadDot} />
                            )}
                        </Pressable>
                    )}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListHeaderComponent={() => (
                        <View style={childStyles.header}>
                        </View>
                    )}
                    ListHeaderComponentStyle={{ marginBottom: 16 }}
                    ListFooterComponentStyle={{ marginTop: 16 }}
                    contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
                />
            ) : (
                <View style={childStyles.empty}>
                    <ThemedText style={childStyles.emptyText}>Aucun ami trouvé</ThemedText>
                </View>
            )}
        </>
    );
};

const childStyles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    headerText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FF1493',
        textShadowColor: 'rgba(255, 105, 180, 0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    headerSubtext: {
        fontSize: 14,
        color: '#FF69B4',
        marginTop: 4,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 25,
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 3,
        borderColor: '#FFB6D9',
    },
    emoji: {
        fontSize: 32,
        marginRight: 12,
    },
    connectedFriend: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: 'rgb(255, 128, 217)',
    },
    disconnectedFriend: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: 'rgb(219, 219, 219)',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    footerText: {
        fontSize: 16,
        color: '#FF69B4',
        fontStyle: 'italic',
    },
    unreadDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FF0000',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 24,
        color: '#FF69B4',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#FFB6C1',
        marginTop: 8,
    },
});

export default FriendTable;
