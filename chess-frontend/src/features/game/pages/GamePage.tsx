import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/AuthContext';
import { getGame } from '../services/gameApi';

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
    const { gameId } = useParams<{ gameId: string }>();
    const { user } = useAuth();

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
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-300" />
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
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                            Chess game
                        </p>

                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
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

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">
                                Game information
                            </h2>

                            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                                {getGameStatusLabel(game.gameResult.status)}
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-500">
                                    Your color
                                </p>
                                <p className="mt-2 text-lg font-bold">
                                    {playerColor ?? 'Unknown'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-500">
                                    Current turn
                                </p>
                                <p className="mt-2 text-lg font-bold">
                                    {game.currentTurn}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-500">
                                    Your clock
                                </p>
                                <p className="mt-2 text-lg font-bold tabular-nums">
                                    {formatTime(playerRemainingMs)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-500">
                                    Opponent clock
                                </p>
                                <p className="mt-2 text-lg font-bold tabular-nums">
                                    {formatTime(opponentRemainingMs)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-800 pt-5">
                            <p className="text-xs text-slate-500">
                                Game ID
                            </p>
                            <p className="mt-1 break-all font-mono text-sm text-slate-300">
                                {game.gameId}
                            </p>

                            <p className="mt-4 text-xs text-slate-500">
                                Opponent ID
                            </p>
                            <p className="mt-1 break-all text-sm text-slate-300">
                                {opponentId ?? 'Unknown'}
                            </p>

                            <p className="mt-4 text-xs text-slate-500">
                                Full move number
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                                {game.fullMoveNumber}
                            </p>

                            <p className="mt-4 text-xs text-slate-500">
                                Pieces on board
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                                {Object.keys(game.board).length}
                            </p>
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                        <h2 className="font-semibold">
                            Recent moves
                        </h2>

                        {game.historyItems.length === 0 ? (
                            <p className="mt-5 text-sm text-slate-500">
                                No moves have been made yet.
                            </p>
                        ) : (
                            <div className="mt-4 space-y-2">
                                {game.historyItems.slice(-10).map((move) => (
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

                        {game.inCheck && (
                            <p className="mt-5 rounded-lg bg-red-400/10 px-3 py-2 text-sm text-red-300">
                                Check!
                            </p>
                        )}
                    </aside>
                </section>
            </div>
        </main>
    );
};