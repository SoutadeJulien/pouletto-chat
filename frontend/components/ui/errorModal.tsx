import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface ErrorModalProps {
    visible: boolean;
    message: string;
    onClose: () => void;
    title?: string;
}

const ErrorModal = ({ visible, message, onClose, title = "Oups !" }: ErrorModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="sad-outline" size={48} color="#FFFFFF" />
                        </View>
                        <ThemedText style={styles.title}>{title}</ThemedText>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <ThemedText style={styles.message}>{message}</ThemedText>
                    </View>

                    {/* Close Button */}
                    <Pressable style={styles.button} onPress={onClose}>
                        <ThemedText style={styles.buttonText}>OK, compris ! 👍</ThemedText>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(255, 57, 195, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#FFE4F3",
        borderRadius: 30,
        width: "100%",
        maxWidth: 340,
        overflow: "hidden",
        shadowColor: "#FF1493",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 3,
        borderColor: "#FFB6D9",
    },
    header: {
        backgroundColor: "#FF6B9D",
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    iconContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#FFFFFF",
        textShadowColor: "rgba(0, 0, 0, 0.1)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    content: {
        padding: 24,
        alignItems: "center",
    },
    message: {
        fontSize: 16,
        color: "#D63384",
        textAlign: "center",
        lineHeight: 24,
        fontWeight: "500",
    },
    button: {
        backgroundColor: "#FF69B4",
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        alignItems: "center",
        shadowColor: "#FF1493",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});

export default ErrorModal;

