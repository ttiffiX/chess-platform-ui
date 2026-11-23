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
    serverTimeEpochMs: number | null;
    isActive: boolean;
    onTimeExpired?: () => boolean;
    className?: string;
}

interface ClockReading {
    snapshotKey: string;
    remainingMs: number;
}

export const GameClock: React.FC<GameClockProps> = ({
                                                        label,
                                                        remainingMs,
                                                        turnStartTimeEpochMs,
                                                        serverTimeEpochMs,
                                                        isActive,
                                                        onTimeExpired,
                                                        className = '',
                                                    }) => {
    const [clockReading, setClockReading] =
        useState<ClockReading | null>(null);

    const handledTurnRef = useRef<string | null>(null);

    // Identify the server clock snapshot currently being displayed.
    const snapshotKey = [
        remainingMs,
        turnStartTimeEpochMs,
        serverTimeEpochMs,
        isActive,
    ].join(':');

    // Calculate elapsed time on the server before the response arrived.
    const serverElapsedMs =
        isActive &&
        turnStartTimeEpochMs !== null &&
        serverTimeEpochMs !== null
            ? Math.max(
                0,
                serverTimeEpochMs - turnStartTimeEpochMs,
            )
            : 0;

    // Fallback value used immediately when a new snapshot arrives.
    const initialRemainingMs =
        remainingMs === null ||
        turnStartTimeEpochMs === null ||
        serverTimeEpochMs === null
            ? null
            : Math.max(0, remainingMs - serverElapsedMs);

    // Synchronize the local clock with each server snapshot.
    useEffect(() => {
        if (
            remainingMs === null ||
            turnStartTimeEpochMs === null ||
            serverTimeEpochMs === null
        ) {
            return;
        }

        const receivedAt = performance.now();

        const baseRemainingMs = Math.max(
            0,
            remainingMs - (
                isActive
                    ? Math.max(
                        0,
                        serverTimeEpochMs - turnStartTimeEpochMs,
                    )
                    : 0
            ),
        );

        const updateClock = () => {
            const clientElapsedMs = isActive
                ? Math.max(
                    0,
                    performance.now() - receivedAt,
                )
                : 0;

            setClockReading({
                snapshotKey,
                remainingMs: Math.max(
                    0,
                    baseRemainingMs - clientElapsedMs,
                ),
            });
        };

        // Schedule the initial reading instead of updating state
        // synchronously inside the effect.
        const initialUpdateId = window.setTimeout(
            updateClock,
            0,
        );

        const intervalId = isActive
            ? window.setInterval(updateClock, 250)
            : null;

        return () => {
            window.clearTimeout(initialUpdateId);

            if (intervalId !== null) {
                window.clearInterval(intervalId);
            }
        };
    }, [
        remainingMs,
        turnStartTimeEpochMs,
        serverTimeEpochMs,
        isActive,
        snapshotKey,
    ]);

    // Ignore an outdated clock reading when a new snapshot arrives.
    const currentRemainingMs =
        clockReading?.snapshotKey === snapshotKey
            ? clockReading.remainingMs
            : initialRemainingMs;

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