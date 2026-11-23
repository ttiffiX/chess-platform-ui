import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren,
} from 'react';

import {ToastContext} from '../context/ToastContext';
import {ToastViewport} from '../components/ToastViewport';
import {subscribeToToast} from '../services/toastEventBus';

import type {
    ToastContextValue,
    ToastItem,
    ToastType,
} from '../toast';

const TOAST_DURATION_MS = 4_000;

export const ToastProvider = ({children}: PropsWithChildren) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // Quản lý timeout theo từng toast để có thể hủy khi dismiss.
    const timersRef = useRef(
        new Map<string, ReturnType<typeof setTimeout>>(),
    );

    const removeToast = useCallback((id: string) => {
        const timer = timersRef.current.get(id);

        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }

        setToasts((currentToasts) =>
            currentToasts.filter((toast) => toast.id !== id),
        );
    }, []);

    const showToast = useCallback((
        message: string,
        type: ToastType = 'info',
    ) => {
        if (!message.trim()) {
            return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const toast: ToastItem = {
            id,
            message,
            type,
        };

        setToasts((currentToasts) => [...currentToasts, toast]);

        const timer = setTimeout(() => {
            removeToast(id);
        }, TOAST_DURATION_MS);

        timersRef.current.set(id, timer);
    }, [removeToast]);

    const showError = useCallback(
        (message: string) => showToast(message, 'error'),
        [showToast],
    );

    const showSuccess = useCallback(
        (message: string) => showToast(message, 'success'),
        [showToast],
    );

    // Nhận thông báo được publish từ bên ngoài React,
    // chẳng hạn Axios interceptor.
    useEffect(() => {
        return subscribeToToast((detail) => {
            showToast(detail.message, detail.type);
        });
    }, [showToast]);

    // Hủy tất cả timeout khi Provider unmount.
    useEffect(() => {
        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, []);

    const contextValue = useMemo<ToastContextValue>(() => ({
        showToast,
        showError,
        showSuccess,
    }), [showToast, showError, showSuccess]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            <ToastViewport
                toasts={toasts}
                onDismiss={removeToast}
            />
        </ToastContext.Provider>
    );
};