import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import {formatTime} from '../utils/formatTime';

interface GameClockProps {
    label: string;
    remainingMs: number | null;
    turnStartTimeEpochMs: number | null;
    isActive: boolean;
    onTimeExpired?: () => boolean;
    className?: string;
}

export const GameClock: React.FC<GameClockProps> = ({
                                                        label,
                                                        remainingMs,
                                                        turnStartTimeEpochMs,
                                                        isActive,
                                                        onTimeExpired,
                                                        className = '',
                                                    }) => {
    const [now, setNow] = useState(() => Date.now());

    const handledTurnRef = useRef<string | null>(null);

    useEffect(() => {
        if (
            !isActive ||
            remainingMs === null ||
            turnStartTimeEpochMs === null
        ) {
            return;
        }

        const updateTime = () => {
            setNow(Date.now());
        };

        updateTime();

        const intervalId = window.setInterval(updateTime, 250);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [
        isActive,
        remainingMs,
        turnStartTimeEpochMs,
    ]);

    const elapsedMs =
        isActive && turnStartTimeEpochMs !== null
            ? Math.max(0, now - turnStartTimeEpochMs)
            : 0;

    const currentRemainingMs =
        remainingMs === null || turnStartTimeEpochMs === null
            ? null
            : Math.max(0, remainingMs - elapsedMs);

    // Request timeout only once successfully for each active turn.
    useEffect(() => {
        if (
            !isActive ||
            currentRemainingMs === null ||
            currentRemainingMs > 0 ||
            turnStartTimeEpochMs === null
        ) {
            return;
        }

        const turnKey = `${turnStartTimeEpochMs}:${label}`;

        if (handledTurnRef.current === turnKey) {
            return;
        }

        const sent = onTimeExpired?.();

        // A false result means the socket is not ready yet.
        // Keep trying on the next clock tick.
        if (sent !== false) {
            handledTurnRef.current = turnKey;
        }
    }, [
        isActive,
        currentRemainingMs,
        now,
        turnStartTimeEpochMs,
        label,
        onTimeExpired,
    ]);

    const time = currentRemainingMs === null
        ? '—:—'
        : formatTime(currentRemainingMs);

    return (
        <div
            aria-label={`${label} clock: ${time}`}
            role="timer"
            aria-live="off"
            className={`
                flex h-10 w-[84px] shrink-0
                items-center justify-center
                rounded-md bg-slate-900
                transition-colors

                min-[951px]:h-[52px]
                min-[951px]:w-[116px]
                min-[951px]:rounded-lg

                ${
                isActive
                    ? 'bg-emerald-400/15'
                    : 'bg-slate-900'
            }

                ${className}
            `}
        >
            <span className={`
                whitespace-nowrap
                font-mono text-sm font-bold
                tabular-nums tracking-tight
                ${
                isActive
                    ? 'text-emerald-300'
                    : 'text-white'
            }
                min-[951px]:text-xl
            `}>
                {time}
            </span>
        </div>
    );
};