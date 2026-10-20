import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastType, ToastItem, ToastContextType } from '../types/Toast';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Helper ref để gọi toast ngoài React Lifecycle (trong Axios Interceptor)
export let globalShowToast: ((message: string, type?: ToastType) => void) | null = null;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    globalShowToast = showToast;

    const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
    const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
            {children}
            {/* Toast Container UI: Đổi vị trí lên góc trên bên phải (top-6 right-6) */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 text-sm font-medium ${
                            toast.type === 'error'
                                ? 'bg-red-950/90 border-red-800 text-red-200'
                                : toast.type === 'success'
                                    ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                                    : toast.type === 'warning'
                                        ? 'bg-amber-950/90 border-amber-800 text-amber-200'
                                        : 'bg-slate-800/90 border-slate-700 text-slate-200'
                        }`}
                    >
                        <span className="flex-1">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};