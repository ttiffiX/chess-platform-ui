import React from 'react';

import {formatTime} from '../utils/formatTime';

interface GameClockProps {
    label: string;
    remainingMs: number | null;
    isActive: boolean;
    className?: string;
}

export const GameClock: React.FC<GameClockProps> = ({
                                                        label,
                                                        remainingMs,
                                                        isActive,
                                                        className = '',
                                                    }) => {
    const time = remainingMs === null
        ? '—:—'
        : formatTime(remainingMs);

    return (
        <div
            aria-label={`${label} clock: ${time}`}
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