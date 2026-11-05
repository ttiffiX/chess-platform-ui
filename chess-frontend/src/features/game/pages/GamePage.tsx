import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/context/AuthContext';
import {getGame} from '../services/gameApi';
import {ChessBoard} from '../components/ChessBoard';

import type {
    GameStateResponse,
    PieceColor,
} from '../types/game';

const getGameStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        IN_PROGRESS: 'In progress',
        CHECKMATE: 'Checkmate',
        STALEMATE: 'Stalemate',
        DRAW_INSUFFICIENT_MATERIAL: 'Draw - insufficient material',
        DRAW_FIFTY_MOVE_RULE: 'Draw - fifty-move rule',
        DRAW_THREEFOLD_REPETITION: 'Draw - threefold repetition',
        DRAW_BY_AGREEMENT: 'Draw by agreement',
        RESIGNED: 'Resigned',
        TIMED_OUT: 'Time out',
    };

    return labels[status] ?? status;
};

const formatTime = (milliseconds: number | null): string => {
    if (milliseconds === null) {
        return 'No clock';
    }

    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
    ) {
        return error.message;
    }

    return 'Unable to load this game. Please try again.';
};

export const GamePage: React.FC = () => {
    const {gameId} = useParams<{ gameId: string }>();
    const {user} = useAuth();

    const [game, setGame] = useState<GameStateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!gameId) {
            setError('Invalid game ID.');
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const loadGame = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const gameState = await getGame(gameId);

                if (!cancelled) {
                    setGame(gameState);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(getErrorMessage(err));
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadGame();

        return () => {
            cancelled = true;
        };
    }, [gameId]);

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <div
                        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-300"/>
                    <p className="mt-4 text-sm text-slate-400">
                        Loading game...
                    </p>
                </div>
            </main>
        );
    }

    if (error || !game) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
                <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
                    <h1 className="text-xl font-bold">
                        Unable to open game
                    </h1>

                    <p className="mt-3 text-sm text-red-300">
                        {error || 'Game data is unavailable.'}
                    </p>

                    <Link
                        to="/home"
                        className="mt-6 inline-flex rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-200"
                    >
                        Back to home
                    </Link>
                </div>
            </main>
        );
    }

    const playerColor: PieceColor | null =
        user?.id === game.whitePlayerId
            ? 'WHITE'
            : user?.id === game.blackPlayerId
                ? 'BLACK'
                : null;

    const opponentColor: PieceColor | null =
        playerColor === 'WHITE'
            ? 'BLACK'
            : playerColor === 'BLACK'
                ? 'WHITE'
                : null;

    const playerRemainingMs =
        playerColor === 'WHITE'
            ? game.whiteRemainingMs
            : playerColor === 'BLACK'
                ? game.blackRemainingMs
                : null;

    const opponentRemainingMs =
        opponentColor === 'WHITE'
            ? game.whiteRemainingMs
            : opponentColor === 'BLACK'
                ? game.blackRemainingMs
                : null;

    const opponentId =
        opponentColor === 'WHITE'
            ? game.whitePlayerId
            : opponentColor === 'BLACK'
                ? game.blackPlayerId
                : null;

    return (
        <main className="min-h-dvh bg-slate-950 px-4 py-3 text-white sm:px-6 min-[951px]:h-dvh min-[951px]:overflow-hidden">
            <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-7xl flex-col min-[951px]:h-full min-[951px]:min-h-0">

                {/* Header */}
                <header className="mb-3 flex shrink-0 items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                            Chess game
                        </p>

                        <h1 className="mt-1 text-2xl font-bold">
                            Game room
                        </h1>
                    </div>

                    <Link
                        to="/home"
                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                        Home
                    </Link>
                </header>

                {/* Main game layout */}
                <section
                    className="
                    grid gap-4
                    min-[951px]:min-h-0
                    min-[951px]:flex-1
                    min-[951px]:grid-cols-[minmax(0,1fr)_300px]
                    min-[951px]:grid-rows-[minmax(0,1fr)]
                "
                >
                    {/* Chess area */}
                    <div className="flex min-w-0 flex-col gap-2 min-[951px]:min-h-0">

                        {/* Opponent */}
                        <div
                            className={`
                            flex min-h-[52px] shrink-0 items-center justify-between
                            rounded-xl border px-4 py-2 transition-colors
                            ${
                                opponentColor !== null &&
                                game.currentTurn === opponentColor
                                    ? 'border-emerald-400/70 bg-emerald-400/10'
                                    : 'border-slate-800 bg-slate-900'
                            }
                        `}
                        >
                            <div>
                                <p className="font-semibold">
                                    Opponent
                                </p>

                                <p className="text-xs text-slate-400">
                                    {opponentColor ?? 'Unknown'}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-slate-500">
                                    Clock
                                </p>

                                <p className="font-mono text-xl font-bold tabular-nums">
                                    {formatTime(opponentRemainingMs)}
                                </p>
                            </div>
                        </div>

                        {/* Chess board */}
                        <div className="flex min-w-0 justify-center min-[951px]:min-h-0 min-[951px]:flex-1 min-[951px]:items-center">
                            <ChessBoard
                                game={game}
                                playerColor={playerColor}
                            />
                        </div>

                        {/* Current player */}
                        <div
                            className={`
                            flex min-h-[52px] shrink-0 items-center justify-between
                            rounded-xl border px-4 py-2 transition-colors
                            ${
                                playerColor !== null &&
                                game.currentTurn === playerColor
                                    ? 'border-emerald-400/70 bg-emerald-400/10'
                                    : 'border-slate-800 bg-slate-900'
                            }
                        `}
                        >
                            <div>
                                <p className="font-semibold">
                                    {user?.name || 'You'}
                                </p>

                                <p className="text-xs text-slate-400">
                                    {playerColor ?? 'Unknown'}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-slate-500">
                                    Clock
                                </p>

                                <p className="font-mono text-xl font-bold tabular-nums">
                                    {formatTime(playerRemainingMs)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Move history */}
                    <aside
                        className="
                        min-w-0 rounded-2xl border border-slate-800
                        bg-slate-900 p-4
                        min-[951px]:flex min-[951px]:min-h-0
                        min-[951px]:flex-col
                    "
                    >
                        <div className="flex shrink-0 items-center justify-between gap-3">
                            <h2 className="font-semibold">
                                Move history
                            </h2>

                            <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                            Move {game.fullMoveNumber}
                        </span>
                        </div>

                        {game.historyItems.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">
                                No moves have been made yet.
                            </p>
                        ) : (
                            <div
                                className="
                                mt-3 space-y-2
                                min-[951px]:min-h-0
                                min-[951px]:flex-1
                                min-[951px]:overflow-y-auto
                                min-[951px]:pr-1
                            "
                            >
                                {game.historyItems.map((move) => (
                                    <div
                                        key={move.moveIndex}
                                        className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm"
                                    >
                                    <span className="text-slate-500">
                                        Move {move.moveIndex}
                                    </span>

                                        <span className="font-mono text-slate-200">
                                        {move.from} → {move.to}
                                    </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>
                </section>
            </div>
        </main>
    );
}