import ErrorModal from "@/components/ui/errorModal";
import { useCallback, useState } from "react";

interface UseErrorModalReturn {
    showError: (message: string, title?: string) => void;
    hideError: () => void;
    ErrorModalComponent: () => React.JSX.Element;
}

const useErrorModal = (): UseErrorModalReturn => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [title, setTitle] = useState("Oups !");

    const showError = useCallback((errorMessage: string, errorTitle: string = "Oups !") => {
        setMessage(errorMessage);
        setTitle(errorTitle);
        setVisible(true);
    }, []);

    const hideError = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            setMessage("");
            setTitle("Oups !");
        }, 300);
    }, []);

    const ErrorModalComponent = useCallback(() => (
        <ErrorModal
            visible={visible}
            message={message}
            title={title}
            onClose={hideError}
        />
    ), [visible, message, title, hideError]);

    return {
        showError,
        hideError,
        ErrorModalComponent,
    };
};

export default useErrorModal;
