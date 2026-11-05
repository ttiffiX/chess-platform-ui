import React from 'react';

import type {
    PieceColor,
    PieceDto,
} from '../types/game';

import {ChessPiece} from './ChessPiece';
import {formatTime} from '../utils/formatTime';

interface GamePlayerCardProps {
    name: string;
    color: PieceColor | null;
    remainingMs: number | null;
    isActive: boolean;
    isCurrentPlayer: boolean;

    capturedPieces: PieceDto[];
    materialAdvantage: number;

    avatarUrl?: string | null;
    rating?: number | null;

    className?: string;
}

const getInitials = (name: string): string => {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '?';
};

export const GamePlayerCard: React.FC<GamePlayerCardProps> = ({
                                                                  name,
                                                                  color,
                                                                  remainingMs,
                                                                  isActive,
                                                                  isCurrentPlayer,
                                                                  capturedPieces,
                                                                  materialAdvantage,
                                                                  avatarUrl,
                                                                  rating,
                                                                  className = '',
                                                              }) => {
    const advantageLabel =
        materialAdvantage > 0
            ? `+${materialAdvantage}`
            : materialAdvantage < 0
                ? `−${Math.abs(materialAdvantage)}`
                : '0';

    return (
        <section
            className={`
                flex min-w-0 items-stretch gap-2
                rounded-xl border p-2
                transition-colors duration-200
                ${
                isActive
                    ? 'border-emerald-400/70 bg-emerald-400/10'
                    : 'border-slate-800 bg-slate-900'
            }
                ${className}
            `}
        >
            {/* Clock */}
            <div className="
                flex w-[76px] shrink-0
                flex-col items-center justify-center
                rounded-lg bg-slate-950/75
                px-1 py-2
            ">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    Clock
                </span>

                <span
                    className={`
                        mt-1 font-mono text-lg font-bold
                        tabular-nums tracking-tight
                        ${
                        isActive
                            ? 'text-emerald-300'
                            : 'text-white'
                    }
                    `}
                >
                    {remainingMs === null
                        ? '—:—'
                        : formatTime(remainingMs)}
                </span>
            </div>

            {/* Player information */}
            <div className="min-w-0 flex-1 py-0.5">
                <div className="flex min-w-0 items-center gap-2">
                    {/* Avatar */}
                    <div className="
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        overflow-hidden rounded-lg
                        border border-slate-700
                        bg-slate-800
                    ">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-bold text-slate-300">
                                {getInitials(name)}
                            </span>
                        )}
                    </div>

                    {/* Name and metadata */}
                    <div className="min-w-0 flex-1">
                        <p
                            className="break-words text-sm font-semibold leading-4 text-white"
                            title={name}
                        >
                            {name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {color && (
                                <span className="text-[10px] font-medium text-slate-400">
                                    {color}
                                </span>
                            )}

                            {rating !== null && rating !== undefined && (
                                <span className="text-[10px] text-slate-500">
                                    {rating}
                                </span>
                            )}

                            {isActive && (
                                <span className="text-[9px] font-semibold text-emerald-300">
                                    {isCurrentPlayer ? 'YOUR TURN' : 'TO MOVE'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Captured material */}
                <div className="mt-2 flex min-w-0 items-center gap-2">
                    <div
                        className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-x-0.5"
                        title="Captured pieces"
                    >
                        {capturedPieces.length === 0 ? (
                            <span className="text-xs text-slate-600">
                                No captures
                            </span>
                        ) : (
                            capturedPieces.map((piece, index) => (
                                <span
                                    key={`${piece.color}-${piece.type}-${index}`}
                                    className="relative h-5 w-5 shrink-0"
                                    title={piece.type}
                                >
                                    <ChessPiece
                                        type={piece.type}
                                        color={piece.color}
                                    />
                                </span>
                            ))
                        )}
                    </div>

                    <span
                        className={`
                            shrink-0 font-mono text-xs font-bold
                            ${
                            materialAdvantage > 0
                                ? 'text-emerald-300'
                                : materialAdvantage < 0
                                    ? 'text-red-300'
                                    : 'text-slate-500'
                        }
                        `}
                        title="Material advantage"
                    >
                        {advantageLabel}
                    </span>
                </div>
            </div>
        </section>
    );
};