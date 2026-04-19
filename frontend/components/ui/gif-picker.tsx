import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { ThemedText } from "../themed-text";

interface GiphyGif {
    id: string;
    url: string;
}

interface GifPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

const GIPHY_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY ?? "";
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

const GifPicker = ({ open, onClose, onSelect }: GifPickerProps) => {
    const [query, setQuery] = useState("");
    const [gifs, setGifs] = useState<GiphyGif[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchGifs = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const endpoint = q.trim()
                ? `${GIPHY_BASE}/search?q=${encodeURIComponent(q)}&api_key=${GIPHY_KEY}&limit=20&rating=g`
                : `${GIPHY_BASE}/trending?api_key=${GIPHY_KEY}&limit=20&rating=g`;

            const res = await fetch(endpoint);
            const data = (await res.json()) as {
                data: Array<{
                    id: string;
                    images: {
                        fixed_width_small: { url: string };
                    };
                }>;
            };

            setGifs(
                (data.data ?? [])
                    .filter((r) => r.images?.fixed_width_small?.url)
                    .map((r) => ({
                        id: r.id,
                        url: r.images.fixed_width_small.url,
                    }))
            );
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) fetchGifs("");
    }, [open, fetchGifs]);

    const handleQueryChange = (text: string) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchGifs(text), 500);
    };

    const handleClose = () => {
        setQuery("");
        onClose();
    };

    return (
        <Modal
            visible={open}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <TextInput
                            style={styles.search}
                            placeholder="Rechercher un GIF..."
                            placeholderTextColor="#FFB6D9"
                            value={query}
                            onChangeText={handleQueryChange}
                            autoFocus
                        />
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color="#FF69B4" />
                        </Pressable>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={styles.loader} size="large" color="#FF69B4" />
                    ) : (
                        <FlatList
                            data={gifs}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={styles.row}
                            contentContainerStyle={styles.list}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.gifItem}
                                    onPress={() => {
                                        onSelect(item.url);
                                        handleClose();
                                    }}
                                >
                                    <Image
                                        source={{ uri: item.url }}
                                        style={styles.gif}
                                        contentFit="cover"
                                    />
                                </Pressable>
                            )}
                        />
                    )}

                    <ThemedText style={styles.attribution}>Powered by GIPHY</ThemedText>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
        backgroundColor: "#FFF0F7",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "70%",
        paddingTop: 12,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingBottom: 10,
        gap: 8,
    },
    search: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        color: "#D63384",
        borderWidth: 2,
        borderColor: "#FFB6D9",
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        flex: 1,
    },
    list: {
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    row: {
        gap: 6,
        marginBottom: 6,
    },
    gifItem: {
        flex: 1,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#FFB6D9",
    },
    gif: {
        width: "100%",
        aspectRatio: 1.6,
    },
    attribution: {
        textAlign: "center",
        fontSize: 11,
        color: "#FFB6D9",
        paddingVertical: 6,
    },
});

export default GifPicker;
