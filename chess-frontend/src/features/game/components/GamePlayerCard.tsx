import React from 'react';

import type {PieceDto} from '../types/game';
import {ChessPiece} from './ChessPiece';
import {getInitials} from '../../../utils/user';

interface GamePlayerCardProps {
    name: string;
    capturedPieces: PieceDto[];
    materialAdvantage: number;
    avatarUrl?: string | null;
    className?: string;
}

interface CapturedMaterialProps {
    pieces: PieceDto[];
    materialAdvantage: number;
    desktop?: boolean;
}

const CapturedMaterial: React.FC<CapturedMaterialProps> = ({
                                                               pieces,
                                                               materialAdvantage,
                                                               desktop = false,
                                                           }) => {
    // Không hiển thị gì khi chưa có quân bị ăn và không có lợi thế.
    if (pieces.length === 0 && materialAdvantage <= 0) {
        return null;
    }

    return (
        <div className={`
            flex min-w-0 items-center gap-1
            ${desktop
            ? 'max-w-[80px] flex-wrap justify-end'
            : 'overflow-hidden'
        }
        `}>
            <div className={`
                flex min-w-0 items-center gap-px
                ${desktop
                ? 'flex-wrap justify-end'
                : 'overflow-hidden'
            }
            `}>
                {pieces.map((piece, index) => (
                    <span
                        key={`${piece.color}-${piece.type}-${index}`}
                        className={`
                            shrink-0
                            ${desktop ? 'h-3 w-3' : 'h-3.5 w-3.5'}
                        `}
                        title={piece.type}
                    >
                        <ChessPiece
                            type={piece.type}
                            color={piece.color}
                        />
                    </span>
                ))}
            </div>

            {materialAdvantage > 0 && (
                <span className="
                    shrink-0 font-mono
                    text-[10px] font-bold
                    text-emerald-300
                ">
                    +{materialAdvantage}
                </span>
            )}
        </div>
    );
};

export const GamePlayerCard: React.FC<GamePlayerCardProps> = ({
                                                                  name,
                                                                  capturedPieces,
                                                                  materialAdvantage,
                                                                  avatarUrl,
                                                                  className = '',
                                                              }) => {
    return (
        <div className={`
            flex h-full min-w-0 items-center gap-1.5
            ${className}
        `}>
            {/* Avatar */}
            <div className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                overflow-hidden rounded-md
                border border-slate-700
                bg-slate-800

                min-[951px]:h-9
                min-[951px]:w-9
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

            {/* Name + captured pieces on mobile */}
            <div className="min-w-0 flex-1">
                <p
                    className="
                        truncate text-sm font-semibold
                        leading-4 text-white
                        min-[951px]:text-xs
                    "
                    title={name}
                >
                    {name}
                </p>

                <div className="mt-px min-w-0 min-[951px]:hidden">
                    <CapturedMaterial
                        pieces={capturedPieces}
                        materialAdvantage={materialAdvantage}
                    />
                </div>
            </div>

            {/* Captured pieces on the right on desktop */}
            <div className="
                hidden w-[80px] shrink-0
                items-center justify-end
                min-[951px]:flex
            ">
                <CapturedMaterial
                    pieces={capturedPieces}
                    materialAdvantage={materialAdvantage}
                    desktop
                />
            </div>
        </div>
    );
};