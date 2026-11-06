import React, {useEffect, useState} from 'react';

import type {
    GameStateResponse,
    PieceColor,
} from '../types/game';

import {ChessPiece} from './ChessPiece';

interface ChessBoardProps {
    game: GameStateResponse;
    playerColor: PieceColor | null;
    isConnected: boolean;
    socketError: string | null;
    onMove: (from: string, to: string) => boolean;
}

interface PendingMove {
    from: string;
    to: string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
                                                          game,
                                                          playerColor,
                                                          isConnected,
                                                          socketError,
                                                          onMove,
                                                      }) => {
    const [selectedSquare, setSelectedSquare] =
        useState<string | null>(null);

    const [pendingMove, setPendingMove] =
        useState<PendingMove | null>(null);

    const [boardMessage, setBoardMessage] =
        useState<string | null>(null);

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

    const isPlayerTurn =
        playerColor !== null &&
        playerColor === game.currentTurn &&
        game.gameResult.status === 'IN_PROGRESS';

    const canInteract =
        isConnected &&
        isPlayerTurn &&
        pendingMove === null;

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

    // Khi trạng thái ván đấu thay đổi, xóa lựa chọn và nước đang chờ.
    useEffect(() => {
        setSelectedSquare(null);
        setPendingMove(null);
        setBoardMessage(null);
    }, [
        game.gameId,
        game.currentTurn,
        game.gameResult.status,
        game.historyItems.length,
    ]);

    // Nếu Backend từ chối nước đi, cho phép người chơi thao tác lại.
    useEffect(() => {
        if (socketError && pendingMove) {
            setPendingMove(null);
        }
    }, [socketError, pendingMove]);

    const handleSquareClick = (square: string) => {
        if (!canInteract) {
            return;
        }

        const piece = game.board[square];

        // Nếu đang chọn quân và click vào ô đi hợp lệ.
        if (selectedSquare && legalDestinations.includes(square)) {
            const movingPiece = game.board[selectedSquare];

            // Tạm thời chưa hỗ trợ lựa chọn quân phong cấp.
            const isPromotion =
                movingPiece?.type === 'PAWN' &&
                (
                    (movingPiece.color === 'WHITE' && square[1] === '8') ||
                    (movingPiece.color === 'BLACK' && square[1] === '1')
                );

            if (isPromotion) {
                setBoardMessage(
                    'Pawn promotion is not available yet.',
                );
                return;
            }

            const move = {
                from: selectedSquare,
                to: square,
            };

            const sent = onMove(move.from, move.to);

            if (sent) {
                setPendingMove(move);
                setSelectedSquare(null);
                setBoardMessage(null);
            }

            return;
        }

        // Click lại chính ô đang chọn để bỏ chọn.
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setBoardMessage(null);
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
            setBoardMessage(null);
            return;
        }

        setSelectedSquare(null);
        setBoardMessage(null);
    };

    return (
        <div className="w-full min-w-0">

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

            {/* Board status */}
            <div className="
                mt-2 flex min-h-8 items-center justify-center
                text-center text-sm
            ">
                {game.gameResult.status !== 'IN_PROGRESS' ? (
                    <p className="text-slate-500">
                        This game has finished.
                    </p>
                ) : socketError ? (
                    <p className="text-red-300">
                        {socketError}
                    </p>
                ) : !isConnected ? (
                    <p className="text-slate-500">
                        Connecting to game server...
                    </p>
                ) : !isPlayerTurn ? (
                    <p className="text-slate-500">
                        Waiting for your turn.
                    </p>
                ) : pendingMove ? (
                    <p className="text-amber-300">
                        Move sent: {pendingMove.from} → {pendingMove.to}
                        <span className="mt-1 block text-xs text-slate-500">
                            Waiting for server confirmation...
                        </span>
                    </p>
                ) : boardMessage ? (
                    <p className="text-amber-300">
                        {boardMessage}
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