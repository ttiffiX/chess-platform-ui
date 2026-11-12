import React, {useEffect, useState} from 'react';

import type {
    GameViewState,
    PieceColor,
    PieceType,
} from '../types/game';

import {ChessPiece} from './ChessPiece';

interface ChessBoardProps {
    game: GameViewState;
    moveIndex: number;
    playerColor: PieceColor | null;
    isConnected: boolean;
    socketError: string | null;
    onMove: (
        from: string,
        to: string,
        promotionType?: PieceType,
    ) => boolean;
}

interface PendingMove {
    from: string;
    to: string;
}

interface PendingPromotion {
    from: string;
    to: string;
    color: PieceColor;
}

type PromotionPieceType = Extract<
    PieceType,
    'QUEEN' | 'ROOK' | 'BISHOP' | 'KNIGHT'
>;

const promotionOptions: {
    type: PromotionPieceType;
    label: string;
}[] = [
    {type: 'QUEEN', label: 'Queen'},
    {type: 'ROOK', label: 'Rook'},
    {type: 'BISHOP', label: 'Bishop'},
    {type: 'KNIGHT', label: 'Knight'},
];

export const ChessBoard: React.FC<ChessBoardProps> = ({
                                                          game,
                                                          moveIndex,
                                                          playerColor,
                                                          isConnected,
                                                          socketError,
                                                          onMove,
                                                      }) => {
    const [selectedSquare, setSelectedSquare] =
        useState<string | null>(null);

    const [pendingMove, setPendingMove] =
        useState<PendingMove | null>(null);

    const [pendingPromotion, setPendingPromotion] =
        useState<PendingPromotion | null>(null);

    // Xoay bàn cờ theo góc nhìn của người chơi.
    const orientation = playerColor ?? 'WHITE';

    const files = orientation === 'WHITE'
        ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

    const ranks = orientation === 'WHITE'
        ? [8, 7, 6, 5, 4, 3, 2, 1]
        : [1, 2, 3, 4, 5, 6, 7, 8];

    // Tạo danh sách 64 ô theo đúng orientation.
    const squares = ranks.flatMap((rank) =>
        files.map((file) => `${file}${rank}`),
    );

    const isGameOver =
        game.gameResult.status !== 'IN_PROGRESS';

    const isPlayerTurn =
        playerColor !== null &&
        playerColor === game.currentTurn &&
        !isGameOver;

    const canInteract =
        isConnected &&
        isPlayerTurn &&
        pendingMove === null &&
        pendingPromotion === null;

    // Những ô có thể đi từ quân đang được chọn.
    const legalDestinations = selectedSquare
        ? game.legalMoves[selectedSquare] ?? []
        : [];

    // Tìm vị trí vua đang bị chiếu.
    const checkedKingSquare = game.inCheck
        ? Object.entries(game.board).find(
        ([, piece]) =>
            piece.type === 'KING' &&
            piece.color === game.currentTurn,
    )?.[0] ?? null
        : null;

    // Nước đi dẫn đến snapshot hiện tại.
    const lastMove = moveIndex > 0
        ? game.historyItems.find(
        (move) => move.moveIndex === moveIndex,
    ) ?? null
        : null;

    // Khi trạng thái ván đấu thay đổi, xóa lựa chọn cũ.
    useEffect(() => {
        setSelectedSquare(null);
        setPendingMove(null);
        setPendingPromotion(null);
    }, [
        game.gameId,
        game.currentTurn,
        game.gameResult.status,
        game.historyItems.length,
        moveIndex,
    ]);

    // Nếu WebSocket báo lỗi, cho phép người chơi thao tác lại.
    useEffect(() => {
        if (socketError && pendingMove) {
            setPendingMove(null);
        }
    }, [socketError, pendingMove]);

    const handlePromotion = (promotionType: PromotionPieceType) => {
        if (!pendingPromotion) {
            return;
        }

        const {from, to} = pendingPromotion;

        const sent = onMove(from, to, promotionType);

        if (!sent) {
            return;
        }

        setPendingMove({from, to});
        setPendingPromotion(null);
        setSelectedSquare(null);
    };

    const handleSquareClick = (square: string) => {
        if (!canInteract) {
            return;
        }

        const piece = game.board[square];

        // Nếu đang chọn quân và click vào ô đi hợp lệ.
        if (
            selectedSquare &&
            legalDestinations.includes(square)
        ) {
            const movingPiece = game.board[selectedSquare];

            // Kiểm tra nước phong cấp.
            const isPromotion =
                movingPiece?.type === 'PAWN' &&
                (
                    (
                        movingPiece.color === 'WHITE' &&
                        square[1] === '8'
                    ) ||
                    (
                        movingPiece.color === 'BLACK' &&
                        square[1] === '1'
                    )
                );

            if (isPromotion && movingPiece) {
                setPendingPromotion({
                    from: selectedSquare,
                    to: square,
                    color: movingPiece.color,
                });
                return;
            }

            const sent = onMove(selectedSquare, square);

            if (sent) {
                setPendingMove({
                    from: selectedSquare,
                    to: square,
                });
                setSelectedSquare(null);
            }

            return;
        }

        // Click lại chính ô đang chọn để bỏ chọn.
        if (selectedSquare === square) {
            setSelectedSquare(null);
            return;
        }

        // Chỉ cho phép chọn quân của người chơi hiện tại
        // và quân đó phải có nước đi hợp lệ.
        if (
            piece &&
            piece.color === playerColor &&
            (game.legalMoves[square]?.length ?? 0) > 0
        ) {
            setSelectedSquare(square);
            return;
        }

        setSelectedSquare(null);
    };

    return (
        <div className="relative w-full min-w-0">

            {/* Chess board container */}
            <div
                className="
                    mx-auto aspect-square w-full
                    max-w-[min(820px,calc(100dvh_-_150px))]
                "
            >
                <div
                    className="
                        grid h-full w-full
                        grid-cols-8 grid-rows-8
                        overflow-hidden rounded-lg
                        border border-slate-700
                        shadow-2xl shadow-black/30
                    "
                    role="group"
                    aria-label="Chess board"
                >
                    {squares.map((square, index) => {
                        const row = Math.floor(index / 8);
                        const column = index % 8;

                        const piece = game.board[square];

                        const isLightSquare =
                            (row + column) % 2 === 0;

                        const isSelected =
                            selectedSquare === square;

                        const isLegalDestination =
                            legalDestinations.includes(square);

                        const isCaptureTarget =
                            isLegalDestination && piece !== undefined;

                        const isLastMoveSquare =
                            lastMove?.from === square ||
                            lastMove?.to === square;

                        const isCheckedKing =
                            checkedKingSquare === square;

                        const isKing =
                            piece?.type === 'KING';

                        const kingAuraClass =
                            isKing && isGameOver
                                ? game.gameResult.winner === null
                                    ? `
                                        ring-4 ring-inset ring-amber-300
                                        shadow-[inset_0_0_24px_rgba(251,191,36,0.65)]
                                    `
                                    : game.gameResult.winner === piece.color
                                        ? `
                                            ring-4 ring-inset ring-emerald-400
                                            shadow-[inset_0_0_24px_rgba(52,211,153,0.75)]
                                        `
                                        : `
                                            ring-4 ring-inset ring-red-500
                                            shadow-[inset_0_0_24px_rgba(239,68,68,0.75)]
                                        `
                                : '';

                        const showFileLabel = row === 7;
                        const showRankLabel = column === 0;

                        return (
                            <button
                                key={square}
                                type="button"
                                disabled={!canInteract}
                                onClick={() => handleSquareClick(square)}
                                aria-label={`${square}${
                                    piece
                                        ? ` ${piece.color} ${piece.type}`
                                        : ' empty'
                                }`}
                                aria-pressed={isSelected}
                                className={`
                                    relative flex min-h-0 min-w-0
                                    items-center justify-center
                                    transition-colors
                                    disabled:cursor-default
                                    ${
                                    isLightSquare
                                        ? 'bg-[#EEEED2]'
                                        : 'bg-[#769656]'
                                }
                                    ${
                                    isSelected
                                        ? 'z-10 ring-4 ring-inset ring-amber-400'
                                        : ''
                                }
                                    ${
                                    isCheckedKing
                                        ? 'z-10 ring-4 ring-inset ring-red-500'
                                        : ''
                                }
                                    ${kingAuraClass}
                                `}
                            >
                                {isLastMoveSquare && (
                                    <span className="
                                        pointer-events-none absolute inset-0
                                        bg-yellow-300/25
                                    "/>
                                )}

                                {isLegalDestination && !isCaptureTarget && (
                                    <span className="
                                        pointer-events-none absolute
                                        h-[22%] w-[22%] rounded-full
                                        bg-slate-900/25
                                    "/>
                                )}

                                {isCaptureTarget && (
                                    <span className="
                                        pointer-events-none absolute inset-[6%]
                                        rounded-full border-[4px]
                                        border-slate-900/25
                                    "/>
                                )}

                                {isCheckedKing && (
                                    <span className="
                                        pointer-events-none absolute inset-0
                                        bg-red-500/35
                                    "/>
                                )}

                                {piece && (
                                    <ChessPiece
                                        type={piece.type}
                                        color={piece.color}
                                    />
                                )}

                                {showFileLabel && (
                                    <span
                                        className={`
                                            pointer-events-none absolute
                                            bottom-0.5 right-1
                                            text-[clamp(0.5rem,1.5vw,0.75rem)]
                                            font-bold
                                            ${
                                            isLightSquare
                                                ? 'text-[#769656]'
                                                : 'text-[#EEEED2]'
                                        }
                                        `}
                                    >
                                        {square[0]}
                                    </span>
                                )}

                                {showRankLabel && (
                                    <span
                                        className={`
                                            pointer-events-none absolute
                                            left-1 top-0.5
                                            text-[clamp(0.5rem,1.5vw,0.75rem)]
                                            font-bold
                                            ${
                                            isLightSquare
                                                ? 'text-[#769656]'
                                                : 'text-[#EEEED2]'
                                        }
                                        `}
                                    >
                                        {square[1]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Promotion chooser */}
            {pendingPromotion && (
                <div
                    className="
                        absolute inset-0 z-30
                        flex items-center justify-center
                        rounded-lg bg-slate-950/75 p-3
                        backdrop-blur-sm
                    "
                >
                    <div className="
                        w-full max-w-xs rounded-2xl
                        border border-slate-700
                        bg-slate-900 p-4
                        shadow-2xl
                    ">
                        <h3 className="text-center text-base font-bold text-white">
                            Choose promotion
                        </h3>

                        <p className="mt-1 text-center text-xs text-slate-400">
                            Select the piece for your pawn.
                        </p>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {promotionOptions.map((option) => (
                                <button
                                    key={option.type}
                                    type="button"
                                    onClick={() => handlePromotion(option.type)}
                                    className="
                                        flex min-w-0 flex-col
                                        items-center gap-1
                                        rounded-xl border border-slate-700
                                        bg-slate-950 p-2
                                        transition
                                        hover:border-emerald-400
                                        hover:bg-slate-800
                                    "
                                >
                                    <span className="flex h-11 w-11 items-center justify-center">
                                        <ChessPiece
                                            type={option.type}
                                            color={pendingPromotion.color}
                                        />
                                    </span>

                                    <span className="text-[10px] font-medium text-slate-300">
                                        {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setPendingPromotion(null)}
                            className="
                                mt-3 w-full rounded-lg
                                px-3 py-2 text-xs font-medium
                                text-slate-400 transition
                                hover:bg-slate-800 hover:text-white
                            "
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};