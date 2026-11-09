
import React from 'react';

import type {
    MoveHistoryDto,
    PieceColor,
} from '../types/game';

import { GameActionBar } from './GameActionBar';

interface MoveHistoryPanelProps {
    historyItems: MoveHistoryDto[];
    fullMoveNumber: number;
    drawOfferedBy: PieceColor | null;
    playerColor: PieceColor | null;

    currentMoveIndex: number;
    latestMoveIndex: number;
    isReviewing: boolean;
    isReviewLoading: boolean;

    canUseGameActions: boolean;

    onReviewIndex: (index: number) => void;
    onReturnToLatest: () => void;

    onOfferDraw: () => void;
    onAcceptDraw: () => void;
    onDeclineDraw: () => void;
    onResign: () => void;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
                                                                      historyItems,
                                                                      fullMoveNumber,
                                                                      drawOfferedBy,
                                                                      playerColor,
                                                                      currentMoveIndex,
                                                                      latestMoveIndex,
                                                                      isReviewing,
                                                                      isReviewLoading,
                                                                      canUseGameActions,
                                                                      onReviewIndex,
                                                                      onReturnToLatest,
                                                                      onOfferDraw,
                                                                      onAcceptDraw,
                                                                      onDeclineDraw,
                                                                      onResign,
                                                                  }) => {
    return (
        <aside className="
            flex h-full min-w-0 flex-col
            overflow-hidden rounded-2xl
            border border-slate-800
            bg-slate-900 p-3 sm:p-4
        ">
            {/* Header */}
            <div className="
                flex shrink-0 min-w-0
                items-center justify-between gap-2
            ">
                <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                        Move history
                    </h2>

                    {isReviewing && (
                        <p className="mt-0.5 text-[10px] text-amber-300">
                            Reviewing previous position
                        </p>
                    )}
                </div>

                <span className="
                    shrink-0 rounded-lg bg-slate-800
                    px-3 py-1 text-xs font-medium text-slate-300
                ">
                    Move {fullMoveNumber}
                </span>
            </div>

            {drawOfferedBy && (
                <p className="
                    mt-3 shrink-0 rounded-lg
                    bg-amber-400/10 px-3 py-2
                    text-xs text-amber-300
                ">
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

                        const isSelected =
                            currentMoveIndex === move.moveIndex;

                        const isLatestMove =
                            move.moveIndex === latestMoveIndex;

                        return (
                            <button
                                key={move.moveIndex}
                                type="button"
                                disabled={isReviewLoading}
                                onClick={() => onReviewIndex(move.moveIndex)}
                                aria-pressed={isSelected}
                                className={`
                                    flex w-full min-w-0
                                    items-center justify-between
                                    gap-2 rounded-lg px-3 py-2
                                    text-left transition
                                    disabled:cursor-wait
                                    ${
                                    isSelected && isReviewing
                                        ? 'bg-amber-400/15 ring-1 ring-amber-400/30'
                                        : isLatestMove && !isReviewing
                                            ? 'bg-emerald-400/10'
                                            : 'bg-slate-950 hover:bg-slate-800'
                                }
                                `}
                            >
                                <span className="
                                    shrink-0 font-mono
                                    text-xs text-slate-500
                                ">
                                    {moveNumber}{isBlackMove ? ' □' : ' ■'}
                                </span>

                                <span className="
                                    min-w-0 truncate text-right
                                    font-mono text-sm text-slate-200
                                ">
                                    {move.from} → {move.to}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Controls */}
            <div className="mt-3 shrink-0">
                <GameActionBar
                    currentMoveIndex={currentMoveIndex}
                    latestMoveIndex={latestMoveIndex}
                    isReviewing={isReviewing}
                    isReviewLoading={isReviewLoading}
                    onReviewIndex={onReviewIndex}
                    onReturnToLatest={onReturnToLatest}
                    canUseGameActions={canUseGameActions}
                    playerColor={playerColor}
                    drawOfferedBy={drawOfferedBy}
                    onOfferDraw={onOfferDraw}
                    onAcceptDraw={onAcceptDraw}
                    onDeclineDraw={onDeclineDraw}
                    onResign={onResign}
                />
            </div>
        </aside>
    );
};
