import { Message, useChat } from "@/hooks/useChat";
import useErrorModal from "@/hooks/useErrorModal";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmojiPicker, { EmojiType } from "rn-emoji-keyboard";
import { ThemedText } from "../themed-text";
import GifPicker from "./gif-picker";

const Chat = ({ userId, friendId }: { userId: string; friendId: string }) => {
    const insets = useSafeAreaInsets();
    const {
        messages,
        pendingMessages,
        sendMessage,
        loadOlderMessages,
        hasMore,
        isLoadingMore,
        isFriendTyping,
        handleTyping,
    } = useChat(userId, friendId);
    const { showError, ErrorModalComponent } = useErrorModal();
    const [inputText, setInputText] = useState("");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [gifPickerOpen, setGifPickerOpen] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const allMessages = [...messages, ...pendingMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    useEffect(() => {
        if (allMessages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [allMessages.length]);

    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text) return;
        setInputText("");
        const success = sendMessage(text);
        if (!success) {
            showError("Message mis en file d'attente — il sera envoyé dès que la connexion sera rétablie.");
        }
    }, [inputText, sendMessage, showError]);

    const handleChangeText = useCallback(
        (text: string) => {
            setInputText(text);
            handleTyping();
        },
        [handleTyping]
    );

    const handleEmojiPick = useCallback((emoji: EmojiType) => {
        setInputText((prev) => prev + emoji.emoji);
    }, []);

    const handleGifSelect = useCallback(
        (url: string) => {
            const success = sendMessage(url, 'gif');
            if (!success) {
                showError("GIF mis en file d'attente — il sera envoyé dès que la connexion sera rétablie.");
            }
        },
        [sendMessage, showError]
    );

    const renderMessage = useCallback(
        ({ item }: { item: Message }) => {
            const isOwn = item.user_id === Number(userId);
            return (
                <View
                    style={[
                        chatStyles.messageBubble,
                        isOwn ? chatStyles.ownMessage : chatStyles.otherMessage,
                        item.pending && chatStyles.pendingMessage,
                        item.type === 'gif' && chatStyles.gifBubble,
                    ]}
                >
                    {!isOwn && (
                        <ThemedText style={chatStyles.messageUsername}>
                            {item.username}
                        </ThemedText>
                    )}
                    {item.type === 'gif' ? (
                        <Image
                            source={{ uri: item.content }}
                            style={chatStyles.gifImage}
                            contentFit="cover"
                        />
                    ) : (
                        <ThemedText
                            style={[
                                chatStyles.messageText,
                                isOwn ? chatStyles.ownMessageText : chatStyles.otherMessageText,
                            ]}
                        >
                            {item.content}
                        </ThemedText>
                    )}
                    <View style={chatStyles.messageFooter}>
                        <ThemedText
                            style={[
                                chatStyles.messageTime,
                                isOwn ? chatStyles.ownMessageTime : chatStyles.otherMessageTime,
                            ]}
                        >
                            {new Date(item.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </ThemedText>
                        {isOwn && (
                            <Ionicons
                                name={
                                    item.pending
                                        ? "time-outline"
                                        : item.read_at
                                        ? "checkmark-done"
                                        : "checkmark"
                                }
                                size={14}
                                color={
                                    item.pending
                                        ? "#FFB6D9"
                                        : item.read_at
                                        ? "#FFFFFF"
                                        : "rgba(255,255,255,0.6)"
                                }
                                style={chatStyles.receiptIcon}
                            />
                        )}
                    </View>
                </View>
            );
        },
        [userId]
    );

    return (
        <KeyboardAvoidingView
            style={chatStyles.container}
            behavior="padding"
            enabled={Platform.OS === 'ios'}
        >
            <ErrorModalComponent />
            <FlatList
                ref={flatListRef}
                data={allMessages}
                keyExtractor={(item) => item.tempId ?? item.id.toString()}
                style={chatStyles.messageList}
                contentContainerStyle={chatStyles.messageListContent}
                ListHeaderComponent={
                    hasMore ? (
                        <Pressable
                            onPress={loadOlderMessages}
                            style={chatStyles.loadMoreButton}
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore ? (
                                <ActivityIndicator size="small" color="#FF69B4" />
                            ) : (
                                <ThemedText style={chatStyles.loadMoreText}>
                                    Charger plus
                                </ThemedText>
                            )}
                        </Pressable>
                    ) : null
                }
                renderItem={renderMessage}
                ListEmptyComponent={() => (
                    <View style={chatStyles.empty}>
                        <ThemedText style={chatStyles.emptyEmoji}>📭</ThemedText>
                        <ThemedText style={chatStyles.emptyText}>
                            Pas encore de messages !
                        </ThemedText>
                        <ThemedText style={chatStyles.emptySubtext}>
                            Dites bonjour ! 👋
                        </ThemedText>
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />

            {isFriendTyping && (
                <View style={chatStyles.typingContainer}>
                    <View style={chatStyles.typingBubble}>
                        <ThemedText style={chatStyles.typingText}>● ● ●</ThemedText>
                    </View>
                </View>
            )}

            <View style={[chatStyles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
                <TextInput
                    style={chatStyles.input}
                    value={inputText}
                    onChangeText={handleChangeText}
                    placeholder="Type a message... ✨"
                    placeholderTextColor="#FFB6D9"
                    multiline
                    maxLength={500}
                    onSubmitEditing={handleSend}
                />
                <Pressable
                    style={chatStyles.emojiButton}
                    onPress={() => setEmojiPickerOpen(true)}
                >
                    <Ionicons name="happy-outline" size={24} color="#FF69B4" />
                </Pressable>
                {!!process.env.EXPO_PUBLIC_GIPHY_API_KEY && (
                    <Pressable
                        style={chatStyles.emojiButton}
                        onPress={() => setGifPickerOpen(true)}
                    >
                        <Ionicons name="image-outline" size={24} color="#FF69B4" />
                    </Pressable>
                )}
                <Pressable
                    style={[
                        chatStyles.sendButton,
                        !inputText.trim() && chatStyles.sendButtonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Ionicons
                        name="send"
                        size={24}
                        color={inputText.trim() ? "#FFFFFF" : "#FFB6D9"}
                    />
                </Pressable>
            </View>
            <EmojiPicker
                onEmojiSelected={handleEmojiPick}
                open={emojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
            />
            {!!process.env.EXPO_PUBLIC_GIPHY_API_KEY && (
                <GifPicker
                    open={gifPickerOpen}
                    onClose={() => setGifPickerOpen(false)}
                    onSelect={handleGifSelect}
                />
            )}
        </KeyboardAvoidingView>
    );
};

const chatStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFE4F3",
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        padding: 16,
        paddingBottom: 8,
    },
    loadMoreButton: {
        alignItems: "center",
        paddingVertical: 10,
        marginBottom: 8,
    },
    loadMoreText: {
        fontSize: 14,
        color: "#FF69B4",
        fontWeight: "600",
    },
    messageBubble: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        maxWidth: "80%",
        boxShadow: "0 2px 4px rgba(255, 105, 180, 0.2)",
        elevation: 3,
        borderWidth: 2,
    },
    ownMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#FF69B4",
        borderBottomRightRadius: 6,
        borderColor: "#FF1493",
    },
    otherMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#FFFFFF",
        borderBottomLeftRadius: 6,
        borderColor: "#FFB6D9",
    },
    pendingMessage: {
        opacity: 0.6,
    },
    messageUsername: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FF69B4",
        marginBottom: 4,
    },
    messageText: {
        fontSize: 16,
        fontWeight: "500",
    },
    ownMessageText: {
        color: "#FFFFFF",
    },
    otherMessageText: {
        color: "#D63384",
    },
    messageFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 4,
        gap: 4,
    },
    messageTime: {
        fontSize: 11,
    },
    ownMessageTime: {
        color: "rgba(255, 255, 255, 0.8)",
    },
    otherMessageTime: {
        color: "#FF69B4",
    },
    receiptIcon: {
        marginLeft: 2,
    },
    typingContainer: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    typingBubble: {
        alignSelf: "flex-start",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderBottomLeftRadius: 6,
        borderWidth: 2,
        borderColor: "#FFB6D9",
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    typingText: {
        fontSize: 14,
        color: "#FFB6D9",
        letterSpacing: 2,
    },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 22,
        fontWeight: "700",
        color: "#FF69B4",
    },
    emptySubtext: {
        fontSize: 16,
        color: "#FFB6C1",
        marginTop: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 12,
        paddingBottom: 20,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        boxShadow: "0 -4px 8px rgba(255, 105, 180, 0.15)",
        elevation: 6,
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: "#FFF0F7",
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 18,
        fontSize: 16,
        color: "#D63384",
        borderWidth: 2,
        borderColor: "#FFB6D9",
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: "#FF69B4",
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(255, 20, 147, 0.3)",
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: "#FFE4F3",
        boxShadow: "none",
        elevation: 0,
    },
    emojiButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    gifBubble: {
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    gifImage: {
        width: 200,
        height: 140,
        borderRadius: 14,
    },
});

export default Chat;
