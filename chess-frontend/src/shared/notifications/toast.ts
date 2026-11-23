export type ToastType =
    | 'success'
    | 'error'
    | 'info'
    | 'warning';

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}

export interface ToastEventDetail {
    message: string;
    type: ToastType;
}

export interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
}