import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/context/AuthContext';
import {getGame} from '../services/gameApi';
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
    const {user, logout, accessToken} = useAuth();
    const {showError} = useToast();

    const [game, setGame] = useState<GameStateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

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

    // Chỉ nhận broadcast thuộc đúng ván đấu đang mở.
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

    // Chỉ kết nối WebSocket sau khi đã tải đúng game.
    const {
        isConnected,
        error: socketError,
        sendMove,
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

    // Lỗi kết nối/gửi message được hiển thị bằng Toast.
    useEffect(() => {
        if (socketError) {
            showError(socketError);
        }
    }, [socketError, showError]);

    // Tự mở popup khi ván đấu kết thúc.
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

    // Resolve clocks.
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
                                />

                                <GameClock
                                    label="You"
                                    remainingMs={playerRemainingMs}
                                    turnStartTimeEpochMs={game.turnStartTimeEpochMs}
                                    isActive={isPlayerTurn}
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
                                game={game}
                                playerColor={playerColor}
                                isConnected={isConnected}
                                socketError={socketError}
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
                            />
                        </div>

                        {/* Move history */}
                        <div className="
                            min-w-0
                            min-[951px]:col-start-3
                            min-[951px]:row-start-1
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
                            {getGameResultDescription(game.gameResult.status)}
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