import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/context/AuthContext';
import {
    getGame,
    getGameSnapshotAt,
} from '../services/gameApi';

import {useGameSocket} from '../hooks/useGameSocket';

import {AppHeader} from '../../../components/layout/AppHeader';
import {useToast} from '../../../context/ToastContext';

import {ChessBoard} from '../components/ChessBoard';
import {GamePlayerCard} from '../components/GamePlayerCard';
import {MoveHistoryPanel} from '../components/MoveHistoryPanel';
import {GameClock} from '../components/GameClock';

import {getGameResultDescription} from '../utils/gameResult';

import {
    getMaterialAdvantage,
    getPiecesCapturedBy,
} from '../utils/materialScore';

import type {
    GameStateResponse,
    GameStatus,
    PieceColor,
} from '../types/game';

interface ReviewState {
    moveIndex: number;
    snapshot: GameStateResponse;
}

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

const getResultDescription = (status: GameStatus): string => {
    return getGameResultDescription(status);
};

export const GamePage: React.FC = () => {
    const {gameId} = useParams<{ gameId: string }>();
    const {user, logout, accessToken} = useAuth();
    const {showError} = useToast();

    const [game, setGame] = useState<GameStateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    // Snapshot review state, independent from live game state.
    const [reviewState, setReviewState] =
        useState<ReviewState | null>(null);

    const [isReviewLoading, setIsReviewLoading] = useState(false);
    const reviewRequestRef = useRef(0);

    // Prevent duplicate timeout requests for the same turn.
    const timeoutRequestRef = useRef<string | null>(null);

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

    // Reset review state when opening another game.
    useEffect(() => {
        reviewRequestRef.current += 1;
        setReviewState(null);
        setIsReviewLoading(false);
    }, [gameId]);

    // Receive live game state from WebSocket.
    const handleGameState = useCallback((nextState: GameStateResponse) => {
        setGame((currentGame) => {
            if (
                !currentGame ||
                currentGame.gameId !== nextState.gameId
            ) {
                return currentGame;
            }

            return nextState;
        });
    }, []);

    const {
        isConnected,
        error: socketError,
        sendMove,
        offerDraw,
        acceptDraw,
        declineDraw,
        resign,
        claimTimeout,
    } = useGameSocket({
        accessToken,
        gameId: gameId ?? null,
        enabled: Boolean(
            game &&
            game.gameId === gameId &&
            accessToken
        ),
        onGameState: handleGameState,
    });

    // Show WebSocket errors through existing toast system.
    useEffect(() => {
        if (socketError) {
            showError(socketError);
        }
    }, [socketError, showError]);

    // Load a historical position by backend moveIndex.
    const handleReviewIndex = useCallback(async (moveIndex: number) => {
        if (!gameId || !game) {
            return;
        }

        const latestMoveIndex = game.historyItems.length;

        if (
            !Number.isInteger(moveIndex) ||
            moveIndex < 0 ||
            moveIndex > latestMoveIndex
        ) {
            return;
        }

        // The latest index means return to the live game.
        const requestId = ++reviewRequestRef.current;

        if (moveIndex === latestMoveIndex) {
            setReviewState(null);
            setIsReviewLoading(false);
            return;
        }

        setIsReviewLoading(true);

        try {
            const snapshot = await getGameSnapshotAt(
                gameId,
                moveIndex,
            );

            // Ignore older responses if the user navigated again.
            if (requestId === reviewRequestRef.current) {
                setReviewState({
                    moveIndex,
                    snapshot,
                });
            }
        } catch (err) {
            if (requestId === reviewRequestRef.current) {
                showError(getErrorMessage(err));
            }
        } finally {
            if (requestId === reviewRequestRef.current) {
                setIsReviewLoading(false);
            }
        }
    }, [gameId, game, showError]);

    const handleReturnToLatest = useCallback(() => {
        reviewRequestRef.current += 1;
        setReviewState(null);
        setIsReviewLoading(false);
    }, []);

    // Automatically ask the backend to claim timeout when the active
    // clock reaches zero. The ref prevents duplicate successful sends.
    const timeoutTurnKey =
        game?.turnStartTimeEpochMs === null ||
        game?.turnStartTimeEpochMs === undefined
            ? null
            : `${game.turnStartTimeEpochMs}:${game.currentTurn}`;

    const handleClockExpired = useCallback((): boolean => {
        if (!timeoutTurnKey) {
            return false;
        }

        if (timeoutRequestRef.current === timeoutTurnKey) {
            return true;
        }

        const sent = claimTimeout();

        if (sent) {
            timeoutRequestRef.current = timeoutTurnKey;
        }

        return sent;
    }, [claimTimeout, timeoutTurnKey]);

    // Open result popup when the live game ends.
    useEffect(() => {
        if (!game) {
            return;
        }

        setIsResultModalOpen(
            game.gameResult.status !== 'IN_PROGRESS',
        );
    }, [
        game?.gameId,
        game?.gameResult.status,
    ]);

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

    // Live state is always kept separately from the review snapshot.
    const isReviewing = reviewState !== null;
    const displayGame = reviewState?.snapshot ?? game;

    const latestMoveIndex = game.historyItems.length;
    const currentMoveIndex =
        reviewState?.moveIndex ?? latestMoveIndex;

    // Resolve player colors.
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

    // Resolve clocks using live state, even while reviewing history.
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

    // Resolve captured pieces.
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

    // Resolve material advantage.
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

    // Active turn.
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

    // Game actions are unavailable while reviewing a historical position.
    const canUseGameActions =
        isConnected &&
        isGameInProgress &&
        !isReviewing &&
        playerColor !== null;

    // Result display.
    const winner = game.gameResult.winner;

    const didPlayerWin =
        playerColor !== null &&
        winner === playerColor;

    const resultHeading =
        winner === null
            ? 'Game drawn'
            : didPlayerWin
                ? 'Congratulations!'
                : 'Game over';

    const resultSummary =
        winner === null
            ? 'The game ended in a draw.'
            : didPlayerWin
                ? 'You won this game!'
                : 'You lost this game.';

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

                        min-[951px]:max-w-[1100px]
                        min-[951px]:min-h-0
                        min-[951px]:flex-1
                        min-[951px]:grid-cols-[180px_minmax(0,1fr)_clamp(160px,calc(100vw_-_1060px),320px)]
                        min-[951px]:grid-rows-[minmax(0,1fr)]
                        min-[951px]:gap-3
                    ">
                        {/* MOBILE: Opponent */}
                        <div className="
                            flex h-10 w-full min-w-0 items-center gap-2
                            min-[951px]:hidden
                        ">
                            <GamePlayerCard
                                name="Opponent"
                                capturedPieces={opponentCapturedPieces}
                                materialAdvantage={opponentMaterialAdvantage}
                                className="flex-1"
                            />

                            <GameClock
                                label="Opponent"
                                remainingMs={opponentRemainingMs}
                                turnStartTimeEpochMs={game.turnStartTimeEpochMs}
                                isActive={isOpponentTurn}
                                onTimeExpired={handleClockExpired}
                            />
                        </div>

                        {/* DESKTOP: Player column */}
                        <div className="
                            hidden min-w-0
                            min-[951px]:col-start-1
                            min-[951px]:row-start-1
                            min-[951px]:flex
                            min-[951px]:h-full
                            min-[951px]:min-h-0
                            min-[951px]:flex-col
                            min-[951px]:items-stretch
                            min-[951px]:py-2
                        ">
                            <GamePlayerCard
                                name="Opponent"
                                capturedPieces={opponentCapturedPieces}
                                materialAdvantage={opponentMaterialAdvantage}
                            />

                            <div className="
                                flex min-h-0 flex-1
                                flex-col items-center justify-center gap-3
                            ">
                                <GameClock
                                    label="Opponent"
                                    remainingMs={opponentRemainingMs}
                                    turnStartTimeEpochMs={game.turnStartTimeEpochMs}
                                    isActive={isOpponentTurn}
                                    onTimeExpired={handleClockExpired}
                                />

                                <GameClock
                                    label="You"
                                    remainingMs={playerRemainingMs}
                                    turnStartTimeEpochMs={game.turnStartTimeEpochMs}
                                    isActive={isPlayerTurn}
                                    onTimeExpired={handleClockExpired}
                                />
                            </div>

                            <GamePlayerCard
                                name={user?.name || 'You'}
                                capturedPieces={playerCapturedPieces}
                                materialAdvantage={playerMaterialAdvantage}
                            />
                        </div>

                        {/* Chess board */}
                        <div className="
                            flex min-w-0 justify-center
                            min-[951px]:col-start-2
                            min-[951px]:row-start-1
                            min-[951px]:min-h-0
                            min-[951px]:items-center
                            min-[951px]:overflow-hidden
                        ">
                            <ChessBoard
                                key={isReviewing ? `review-${currentMoveIndex}` : 'live'}
                                game={displayGame}
                                playerColor={playerColor}
                                isConnected={isConnected && !isReviewing}
                                socketError={isReviewing ? null : socketError}
                                onMove={sendMove}
                            />
                        </div>

                        {/* MOBILE: Current player */}
                        <div className="
                            flex h-10 w-full min-w-0 items-center gap-2
                            min-[951px]:hidden
                        ">
                            <GamePlayerCard
                                name={user?.name || 'You'}
                                capturedPieces={playerCapturedPieces}
                                materialAdvantage={playerMaterialAdvantage}
                                className="flex-1"
                            />

                            <GameClock
                                label="You"
                                remainingMs={playerRemainingMs}
                                turnStartTimeEpochMs={game.turnStartTimeEpochMs}
                                isActive={isPlayerTurn}
                                onTimeExpired={handleClockExpired}
                            />
                        </div>

                        {/* Move history and actions */}
                        <div className="
                            min-w-0
                            min-[951px]:col-start-3
                            min-[951px]:row-start-1
                            min-[951px]:min-h-0
                        ">
                            <MoveHistoryPanel
                                historyItems={game.historyItems}
                                fullMoveNumber={displayGame.fullMoveNumber}
                                drawOfferedBy={game.drawOfferedBy}
                                playerColor={playerColor}
                                currentMoveIndex={currentMoveIndex}
                                latestMoveIndex={latestMoveIndex}
                                isReviewing={isReviewing}
                                isReviewLoading={isReviewLoading}
                                canUseGameActions={canUseGameActions}
                                onReviewIndex={handleReviewIndex}
                                onReturnToLatest={handleReturnToLatest}
                                onOfferDraw={offerDraw}
                                onAcceptDraw={acceptDraw}
                                onDeclineDraw={declineDraw}
                                onResign={resign}
                            />
                        </div>
                    </section>
                </div>
            </main>

            {/* Game result popup */}
            {!isGameInProgress && isResultModalOpen && (
                <div className="
                    fixed inset-0 z-[100]
                    flex items-center justify-center
                    bg-black/70 p-4 backdrop-blur-sm
                ">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="game-result-title"
                        className="
                            w-full max-w-sm rounded-2xl
                            border border-slate-700
                            bg-slate-900 p-6 text-center
                            shadow-2xl shadow-black/50
                        "
                    >
                        <div className="
                            mx-auto flex h-16 w-16
                            items-center justify-center
                            rounded-2xl
                            bg-emerald-400/10 text-3xl
                        ">
                            {winner === null ? '½' : didPlayerWin ? '🏆' : '♟'}
                        </div>

                        <h2
                            id="game-result-title"
                            className="mt-4 text-2xl font-bold text-white"
                        >
                            {resultHeading}
                        </h2>

                        <p className="mt-2 text-sm text-slate-300">
                            {resultSummary}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                            {getResultDescription(game.gameResult.status)}
                        </p>

                        {winner && (
                            <p className="mt-2 text-sm font-semibold text-emerald-300">
                                {winner === 'WHITE' ? 'White' : 'Black'} wins
                            </p>
                        )}

                        <div className="mt-6 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => setIsResultModalOpen(false)}
                                className="
                                    w-full rounded-xl
                                    border border-slate-700
                                    bg-slate-800 px-4 py-3
                                    text-sm font-semibold text-white
                                    transition hover:bg-slate-700
                                "
                            >
                                View final position
                            </button>

                            <Link
                                to="/home"
                                className="
                                    w-full rounded-xl
                                    bg-emerald-300 px-4 py-3
                                    text-sm font-bold text-slate-950
                                    transition hover:bg-emerald-200
                                "
                            >
                                Back to lobby
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};