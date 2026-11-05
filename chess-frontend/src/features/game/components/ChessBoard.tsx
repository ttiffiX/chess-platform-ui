import React, {useEffect, useState} from 'react';

import type {
    GameStateResponse,
    PieceColor,
} from '../types/game';

import {ChessPiece} from './ChessPiece';

interface ChessBoardProps {
    game: GameStateResponse;
    playerColor: PieceColor | null;
}

interface PendingMove {
    from: string;
    to: string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({game, playerColor,}) => {
    const [selectedSquare, setSelectedSquare] =
        useState<string | null>(null);

    const [pendingMove, setPendingMove] =
        useState<PendingMove | null>(null);

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

    const canInteract =
        playerColor !== null &&
        playerColor === game.currentTurn &&
        game.gameResult.status === 'IN_PROGRESS';

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

    const lastMove = game.historyItems.length > 0
        ? game.historyItems[game.historyItems.length - 1]
        : null;

    // Khi lượt đi thay đổi, xóa lựa chọn cũ.
    useEffect(() => {
        setSelectedSquare(null);
        setPendingMove(null);
    }, [game.gameId, game.currentTurn]);

    const handleSquareClick = (square: string) => {
        if (!canInteract) {
            return;
        }

        const piece = game.board[square];

        // Nếu đang chọn quân và click vào ô đi hợp lệ.
        if (selectedSquare && legalDestinations.includes(square)) {
            setPendingMove({
                from: selectedSquare,
                to: square,
            });

            setSelectedSquare(null);
            return;
        }

        // Click lại chính ô đang chọn để bỏ chọn.
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setPendingMove(null);
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
            setPendingMove(null);
            return;
        }

        setSelectedSquare(null);
        setPendingMove(null);
    };

    return (
        <div className="w-full min-w-0">

            {/* Chess board container */}
            <div
                className="
                mx-auto aspect-square w-full
                max-w-[min(680px,calc(100dvh_-_264px))]
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
                            `}
                            >
                                {isLastMoveSquare && (
                                    <span className="pointer-events-none absolute inset-0 bg-yellow-300/25" />
                                )}

                                {isLegalDestination && !isCaptureTarget && (
                                    <span className="pointer-events-none absolute h-[22%] w-[22%] rounded-full bg-slate-900/25" />
                                )}

                                {isCaptureTarget && (
                                    <span className="pointer-events-none absolute inset-[6%] rounded-full border-[4px] border-slate-900/25" />
                                )}

                                {isCheckedKing && (
                                    <span className="pointer-events-none absolute inset-0 bg-red-500/35" />
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
                                        pointer-events-none absolute bottom-0.5 right-1
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
                                        pointer-events-none absolute left-1 top-0.5
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

            {/* Board status */}
            <div className="mt-2 flex min-h-8 items-center justify-center text-center text-sm">
                {!canInteract ? (
                    <p className="text-slate-500">
                        {game.gameResult.status !== 'IN_PROGRESS'
                            ? 'This game has finished.'
                            : 'Waiting for your turn.'
                        }
                    </p>
                ) : pendingMove ? (
                    <p className="text-amber-300">
                        Selected move: {pendingMove.from} → {pendingMove.to}

                        <span className="mt-1 block text-xs text-slate-500">
                        Move synchronization will be connected next.
                    </span>
                    </p>
                ) : selectedSquare ? (
                    <p className="text-emerald-300">
                        Select a destination square.
                    </p>
                ) : (
                    <p className="text-slate-500">
                        Select one of your pieces to see legal moves.
                    </p>
                )}
            </div>
        </div>
    );
};
