import React from 'react';

import type {PieceColor} from '../types/game';

type ReviewIconType = 'first' | 'previous' | 'next' | 'latest';

interface ReviewIconProps {
    type: ReviewIconType;
}

interface GameActionBarProps {
    currentMoveIndex: number;
    latestMoveIndex: number;
    isReviewing: boolean;
    isReviewLoading: boolean;
    onReviewIndex: (index: number) => void;
    onReturnToLatest: () => void;

    canUseGameActions: boolean;
    playerColor: PieceColor | null;
    drawOfferedBy: PieceColor | null;

    onOfferDraw: () => void;
    onAcceptDraw: () => void;
    onDeclineDraw: () => void;
    onResign: () => void;
}

const ReviewIcon: React.FC<ReviewIconProps> = ({type}) => {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {type === 'first' && (
                <>
                    <path d="M5 5v14"/>
                    <path d="m19 5-7 7 7 7"/>
                </>
            )}

            {type === 'previous' && (
                <path d="m15 18-6-6 6-6"/>
            )}

            {type === 'next' && (
                <path d="m9 18 6-6-6-6"/>
            )}

            {type === 'latest' && (
                <>
                    <path d="M19 5v14"/>
                    <path d="m5 5 7 7-7 7"/>
                </>
            )}
        </svg>
    );
};

const reviewControls: {
    type: ReviewIconType;
    label: string;
}[] = [
    {type: 'first', label: 'First move'},
    {type: 'previous', label: 'Previous move'},
    {type: 'next', label: 'Next move'},
    {type: 'latest', label: 'Latest move'},
];

export const GameActionBar: React.FC<GameActionBarProps> = ({
                                                                currentMoveIndex,
                                                                latestMoveIndex,
                                                                isReviewing,
                                                                isReviewLoading,
                                                                onReviewIndex,
                                                                onReturnToLatest,
                                                                canUseGameActions,
                                                                playerColor,
                                                                drawOfferedBy,
                                                                onOfferDraw,
                                                                onAcceptDraw,
                                                                onDeclineDraw,
                                                                onResign,
                                                            }) => {
    const canGoBack =
        !isReviewLoading && currentMoveIndex > 0;

    const canGoForward =
        !isReviewLoading &&
        currentMoveIndex < latestMoveIndex;

    const hasOpponentDrawOffer =
        drawOfferedBy !== null &&
        playerColor !== null &&
        drawOfferedBy !== playerColor;

    const hasOwnDrawOffer =
        drawOfferedBy !== null &&
        drawOfferedBy === playerColor;

    const handleResign = () => {
        const confirmed = window.confirm(
            'Are you sure you want to resign this game?',
        );

        if (confirmed) {
            onResign();
        }
    };

    return (
        <section className="shrink-0 border-t border-slate-700/70 pt-3">
            {/* Review controls */}
            <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="
                        text-[10px] font-semibold
                        uppercase tracking-wider text-slate-500
                    ">
                        Review game
                    </p>

                    {isReviewLoading && (
                        <span className="text-[10px] text-amber-300">
                            Loading...
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {reviewControls.map((control) => {
                        let disabled = isReviewLoading;
                        let onClick: () => void;

                        switch (control.type) {
                            case 'first':
                                disabled ||= currentMoveIndex <= 0;
                                onClick = () => onReviewIndex(0);
                                break;

                            case 'previous':
                                disabled ||= !canGoBack;
                                onClick = () =>
                                    onReviewIndex(currentMoveIndex - 1);
                                break;

                            case 'next':
                                disabled ||= !canGoForward;
                                onClick = () =>
                                    onReviewIndex(currentMoveIndex + 1);
                                break;

                            case 'latest':
                                disabled ||= !isReviewing;
                                onClick = onReturnToLatest;
                                break;
                        }

                        return (
                            <button
                                key={control.type}
                                type="button"
                                title={control.label}
                                aria-label={control.label}
                                disabled={disabled}
                                onClick={onClick}
                                className="
                                    flex h-10 items-center justify-center
                                    rounded-lg border border-slate-700
                                    bg-slate-950 text-slate-300
                                    transition hover:bg-slate-800
                                    disabled:cursor-not-allowed
                                    disabled:opacity-35
                                "
                            >
                                <ReviewIcon type={control.type}/>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Game actions */}
            <div className="mt-3">
                <p className="
                    mb-2 text-[10px] font-semibold
                    uppercase tracking-wider text-slate-500
                ">
                    Game actions
                </p>

                {hasOwnDrawOffer ? (
                    <p className="
                        rounded-lg border border-amber-500/20
                        bg-amber-400/10 px-3 py-2
                        text-center text-xs text-amber-300
                    ">
                        Draw offer sent. Waiting for opponent...
                    </p>
                ) : hasOpponentDrawOffer ? (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            disabled={!canUseGameActions}
                            onClick={onAcceptDraw}
                            className="
                                rounded-lg border border-emerald-500/30
                                bg-emerald-500/10 px-3 py-2
                                text-xs font-semibold text-emerald-300
                                transition hover:bg-emerald-500/20
                                disabled:cursor-not-allowed disabled:opacity-40
                            "
                        >
                            Accept draw
                        </button>

                        <button
                            type="button"
                            disabled={!canUseGameActions}
                            onClick={onDeclineDraw}
                            className="
                                rounded-lg border border-slate-700
                                bg-slate-950 px-3 py-2
                                text-xs font-medium text-slate-300
                                transition hover:bg-slate-800
                                disabled:cursor-not-allowed disabled:opacity-40
                            "
                        >
                            Decline
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled={!canUseGameActions}
                        onClick={onOfferDraw}
                        className="
                            w-full rounded-lg border border-slate-700
                            bg-slate-950 px-3 py-2
                            text-xs font-medium text-slate-300
                            transition hover:bg-slate-800
                            disabled:cursor-not-allowed disabled:opacity-40
                        "
                    >
                        Offer draw
                    </button>
                )}

                <button
                    type="button"
                    disabled={!canUseGameActions}
                    onClick={handleResign}
                    className="
                        mt-2 w-full rounded-lg
                        border border-red-500/30
                        bg-red-500/10 px-3 py-2
                        text-xs font-medium text-red-300
                        transition hover:bg-red-500/20
                        disabled:cursor-not-allowed disabled:opacity-40
                    "
                >
                    Resign
                </button>
            </div>
        </section>
    );
};