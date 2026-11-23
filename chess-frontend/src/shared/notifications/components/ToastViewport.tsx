import type {ToastItem, ToastType} from '../toast';

interface ToastViewportProps {
    toasts: ToastItem[];
    onDismiss: (id: string) => void;
}

const TOAST_STYLES: Record<
    ToastType,
    {
        container: string;
        icon: string;
        symbol: string;
    }
> = {
    success: {
        container: 'bg-emerald-950/95 border-emerald-800 text-emerald-200',
        icon: 'bg-emerald-500/15 text-emerald-300',
        symbol: '✓',
    },
    error: {
        container: 'bg-red-950/95 border-red-800 text-red-200',
        icon: 'bg-red-500/15 text-red-300',
        symbol: '!',
    },
    warning: {
        container: 'bg-amber-950/95 border-amber-800 text-amber-200',
        icon: 'bg-amber-500/15 text-amber-300',
        symbol: '⚠',
    },
    info: {
        container: 'bg-slate-800/95 border-slate-700 text-slate-200',
        icon: 'bg-slate-500/15 text-slate-300',
        symbol: 'i',
    },
};

export const ToastViewport = ({
                                  toasts,
                                  onDismiss,
                              }: ToastViewportProps) => {
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div
            aria-live="polite"
            className="
                pointer-events-none fixed right-4 top-4 z-[200]
                flex w-[calc(100vw-2rem)] max-w-sm
                flex-col gap-2 sm:right-6 sm:top-6
            "
        >
            {toasts.map((toast) => {
                const styles = TOAST_STYLES[toast.type];

                return (
                    <div
                        key={toast.id}
                        role={toast.type === 'error' ? 'alert' : 'status'}
                        className={`
                            pointer-events-auto flex items-center gap-3
                            rounded-xl border p-4 shadow-xl
                            backdrop-blur-md text-sm font-medium
                            ${styles.container}
                        `}
                    >
                        <span
                            aria-hidden="true"
                            className={`
                                flex h-7 w-7 shrink-0 items-center
                                justify-center rounded-full font-bold
                                ${styles.icon}
                            `}
                        >
                            {styles.symbol}
                        </span>

                        <p className="min-w-0 flex-1 break-words">
                            {toast.message}
                        </p>

                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            onClick={() => onDismiss(toast.id)}
                            className="
                                shrink-0 rounded-md p-1
                                text-slate-400 transition-colors
                                hover:bg-white/10 hover:text-white
                            "
                        >
                            <span aria-hidden="true">✕</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
};