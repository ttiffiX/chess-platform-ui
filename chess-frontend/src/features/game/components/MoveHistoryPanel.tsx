import React from 'react';

import type {
    MoveHistoryDto,
    PieceColor,
} from '../types/game';

import {GameActionBar} from './GameActionBar';

interface MoveHistoryPanelProps {
    historyItems: MoveHistoryDto[];
    fullMoveNumber: number;
    drawOfferedBy: PieceColor | null;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
                                                                      historyItems,
                                                                      fullMoveNumber,
                                                                      drawOfferedBy,
                                                                  }) => {
    return (
        <aside className="
            flex h-full min-w-0 flex-col
            overflow-hidden rounded-2xl
            border border-slate-800
            bg-slate-900 p-3 sm:p-4
        ">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-2">
                <h2 className="font-semibold">
                    Move history
                </h2>

                <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                    Move {fullMoveNumber}
                </span>
            </div>

            {drawOfferedBy && (
                <p className="mt-3 shrink-0 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                    {drawOfferedBy} has offered a draw.
                </p>
            )}

            {/* Move list */}
            <div className="
                mt-3 min-h-[120px] flex-1
                space-y-1 overflow-y-auto pr-1
                max-h-[320px] min-[951px]:max-h-none
            ">
                {historyItems.length === 0 ? (
                    <p className="py-4 text-sm text-slate-500">
                        No moves have been made yet.
                    </p>
                ) : (
                    historyItems.map((move) => {
                        const moveNumber = Math.ceil(move.moveIndex / 2);
                        const isBlackMove = move.moveIndex % 2 === 0;
                        const isLatestMove =
                            move.moveIndex === historyItems[historyItems.length - 1].moveIndex;

                        return (
                            <div
                                key={move.moveIndex}
                                className={`
                                    flex items-center justify-between
                                    gap-3 rounded-lg px-3 py-2
                                    ${
                                    isLatestMove
                                        ? 'bg-emerald-400/10'
                                        : 'bg-slate-950'
                                }
                                `}
                            >
                                <span className="shrink-0 font-mono text-xs text-slate-500">
                                    {moveNumber}{isBlackMove ? ' □' : ' ■'}
                                </span>

                                <span className="font-mono text-sm text-slate-200">
                                    {move.from} → {move.to}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Controls */}
            <div className="mt-3 shrink-0">
                <GameActionBar/>
            </div>
        </aside>
    );
};