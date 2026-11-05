import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/context/AuthContext';
import {getGame} from '../services/gameApi';
import {AppHeader} from '../../../components/layout/AppHeader';
import {ChessBoard} from '../components/ChessBoard';
import {GamePlayerCard} from '../components/GamePlayerCard';
import {MoveHistoryPanel} from '../components/MoveHistoryPanel';

import {
    getMaterialAdvantage,
    getPiecesCapturedBy,
} from '../utils/materialScore';

import type {
    GameStateResponse,
    PieceColor,
} from '../types/game';

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
    const {user, logout} = useAuth();

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
            <div className="min-h-dvh bg-slate-950 text-white">
                <AppHeader user={user} onLogout={logout}/>

                <main className="
                flex min-h-[calc(100dvh-4rem)]
                items-center justify-center
            ">
                    <div className="text-center">
                        <div className="
                        mx-auto h-8 w-8 animate-spin
                        rounded-full border-2 border-slate-600
                        border-t-emerald-300
                    "/>

                        <p className="mt-4 text-sm text-slate-400">
                            Loading game...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="min-h-dvh bg-slate-950 text-white">
                <AppHeader user={user} onLogout={logout}/>

                <main className="
                flex min-h-[calc(100dvh-4rem)]
                items-center justify-center px-4
            ">
                    <div className="
                    w-full max-w-md rounded-2xl
                    border border-slate-800
                    bg-slate-900 p-6 text-center
                ">
                        <h1 className="text-xl font-bold">
                            Unable to open game
                        </h1>

                        <p className="mt-3 text-sm text-red-300">
                            {error || 'Game data is unavailable.'}
                        </p>

                        <Link
                            to="/home"
                            className="
                            mt-6 inline-flex rounded-xl
                            bg-emerald-300 px-5 py-2.5
                            text-sm font-bold text-slate-950
                            hover:bg-emerald-200
                        "
                        >
                            Back to home
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    // Resolve player colors
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

    // Resolve clocks
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

    // Resolve captured pieces
    const playerCapturedPieces = getPiecesCapturedBy(
        playerColor,
        game.capturedWhitePieces,
        game.capturedBlackPieces,
    );

    const opponentCapturedPieces = getPiecesCapturedBy(
        opponentColor,
        game.capturedWhitePieces,
        game.capturedBlackPieces,
    );

    // Resolve material advantage
    const playerMaterialAdvantage = getMaterialAdvantage(
        playerColor,
        game.capturedWhitePieces,
        game.capturedBlackPieces,
    );

    const opponentMaterialAdvantage = getMaterialAdvantage(
        opponentColor,
        game.capturedWhitePieces,
        game.capturedBlackPieces,
    );

    // Active turn
    const isGameInProgress =
        game.gameResult.status === 'IN_PROGRESS';

    const isPlayerTurn =
        isGameInProgress &&
        playerColor !== null &&
        game.currentTurn === playerColor;

    const isOpponentTurn =
        isGameInProgress &&
        opponentColor !== null &&
        game.currentTurn === opponentColor;

    return (
        <div className="
        min-h-dvh bg-slate-950 text-white
        min-[951px]:h-dvh min-[951px]:overflow-hidden
    ">
            <AppHeader
                user={user}
                onLogout={logout}
            />

            <main className="
            min-h-[calc(100dvh-4rem)]
            px-3 py-2 sm:px-6 sm:py-3
            min-[951px]:h-[calc(100dvh-4rem)]
            min-[951px]:min-h-0
            min-[951px]:overflow-hidden
        ">
                <div className="
                mx-auto flex min-h-[calc(100dvh-5rem)]
                max-w-[1600px] flex-col
                min-[951px]:h-full
                min-[951px]:min-h-0
            ">

                    {/* Main game layout */}
                    <section className="
                    mx-auto grid w-full
                    max-w-[min(100%,820px,calc(100dvh_-_330px))]
                    grid-cols-1 gap-2

                    min-[951px]:max-w-[1440px]
                    min-[951px]:min-h-0
                    min-[951px]:flex-1
                    min-[951px]:grid-cols-[200px_minmax(0,1fr)_minmax(300px,340px)]
                    min-[951px]:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]
                    min-[951px]:gap-3
                ">
                        {/* Opponent */}
                        <div className="
                        min-w-0
                        min-[951px]:col-start-1
                        min-[951px]:row-start-1
                        min-[951px]:self-end
                    ">
                            <GamePlayerCard
                                name="Opponent"
                                color={opponentColor}
                                remainingMs={opponentRemainingMs}
                                isActive={isOpponentTurn}
                                isCurrentPlayer={false}
                                capturedPieces={opponentCapturedPieces}
                                materialAdvantage={opponentMaterialAdvantage}
                            />
                        </div>

                        {/* Chess board */}
                        <div className="
                        flex min-w-0 justify-center
                        min-[951px]:col-start-2
                        min-[951px]:row-start-1
                        min-[951px]:row-span-2
                        min-[951px]:min-h-0
                        min-[951px]:items-center
                        min-[951px]:overflow-hidden
                    ">
                            <ChessBoard
                                game={game}
                                playerColor={playerColor}
                            />
                        </div>

                        {/* Current player */}
                        <div className="
                        min-w-0
                        min-[951px]:col-start-1
                        min-[951px]:row-start-2
                        min-[951px]:self-start
                    ">
                            <GamePlayerCard
                                name={user?.name || 'You'}
                                color={playerColor}
                                remainingMs={playerRemainingMs}
                                isActive={isPlayerTurn}
                                isCurrentPlayer
                                capturedPieces={playerCapturedPieces}
                                materialAdvantage={playerMaterialAdvantage}
                            />
                        </div>

                        {/* Move history */}
                        <div className="
                        min-w-0
                        min-[951px]:col-start-3
                        min-[951px]:row-start-1
                        min-[951px]:row-span-2
                        min-[951px]:min-h-0
                    ">
                            <MoveHistoryPanel
                                historyItems={game.historyItems}
                                fullMoveNumber={game.fullMoveNumber}
                                drawOfferedBy={game.drawOfferedBy}
                            />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};