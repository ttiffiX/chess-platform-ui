import React, {useEffect} from 'react';

import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/hooks/useAuth';

import {AppHeader} from '../../../components/layout/AppHeader';

import {ChessBoard} from '../../game/components/ChessBoard';
import {GamePlayerCard} from '../../game/components/GamePlayerCard';
import {GameClock} from '../../game/components/GameClock';

import {AnalysisMoveHistoryPanel} from '../components/AnalysisMoveHistoryPanel';

import {useGameAnalysis} from '../hooks/useGameAnalysis';

import {createAnalysisViewState} from '../utils/analysisView';

import {useToast} from '../../../shared/notifications/hooks/useToast';

import {
    getPiecesCapturedBy,
    getMaterialAdvantage,
} from '../../game/utils/materialScore';

import {
    GAME_STATUS_LABELS,
} from '../../game/utils/gameResult';

import {
    getAvatarUrl,
    getDisplayName,
} from '../../../utils/user';

import {formatTimeControl} from '../../../utils/time';

import type {
    GameResult,
    PieceColor,
} from '../../game/types/game';

import type {
    GameReplayDto,
} from '../types/gameAnalysis';

import type {
    AnalysisNode,
} from '../types/tree';

interface ClockSnapshot {
    whiteRemainingMs: number | null;
    blackRemainingMs: number | null;
}

const getClockSnapshot = (
    replay: GameReplayDto,
    path: AnalysisNode[],
): ClockSnapshot => {
    if (replay.baseSeconds <= 0) {
        return {
            whiteRemainingMs: null,
            blackRemainingMs: null,
        };
    }

    let whiteRemainingMs = replay.baseSeconds * 1000;
    let blackRemainingMs = replay.baseSeconds * 1000;

    for (const node of path) {
        if (
            node.ply === 0 ||
            node.moverClockAfterMs === null
        ) {
            continue;
        }

        if (node.ply % 2 === 1) {
            whiteRemainingMs = node.moverClockAfterMs;
        } else {
            blackRemainingMs = node.moverClockAfterMs;
        }
    }

    return {
        whiteRemainingMs,
        blackRemainingMs,
    };
};

const getOpponentColor = (
    playerColor: PieceColor,
): PieceColor => {
    return playerColor === 'WHITE'
        ? 'BLACK'
        : 'WHITE';
};

const formatGameResult = (
    result: GameResult,
): string => {
    const label = GAME_STATUS_LABELS[result.status];

    if (result.winner === 'WHITE') {
        return `White wins · ${label}`;
    }

    if (result.winner === 'BLACK') {
        return `Black wins · ${label}`;
    }

    return label;
};

export const GameAnalysisPage: React.FC = () => {
    const {gameId} = useParams<{ gameId: string }>();

    const {user, logout} = useAuth();
    const {showError} = useToast();

    const {
        status,
        error,
        replay,
        tree,
        workspace,
        selectedNode,
        selectedPath,
        isAnalyzing,
        analysisError,
        boardResetVersion,
        selectNode,
        analyzeSelectedMove,
    } = useGameAnalysis(gameId ?? null);

    useEffect(() => {
        if (analysisError) {
            showError(analysisError);
        }
    }, [analysisError, showError]);

    // ---------------------------------------------------------------------
    // Loading
    // ---------------------------------------------------------------------

    if (status === 'loading') {
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
                            Reconstructing game replay...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    // ---------------------------------------------------------------------
    // Error
    // ---------------------------------------------------------------------

    if (status === 'error' || !replay || !tree || !workspace) {
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
                            Unable to load game analysis
                        </h1>

                        <p className="mt-3 text-sm text-red-300">
                            {error || 'Game replay is unavailable.'}
                        </p>

                        <Link
                            to="/history"
                            className="
                                mt-6 inline-flex rounded-xl
                                bg-emerald-300 px-5 py-2.5
                                text-sm font-bold text-slate-950
                                transition hover:bg-emerald-200
                            "
                        >
                            Back to game history
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    if (!selectedNode) {
        return null;
    }

    // ---------------------------------------------------------------------
    // Current analysis position
    // ---------------------------------------------------------------------

    const boardState = createAnalysisViewState(
        replay,
        workspace,
        user?.id ?? '',
    );

    const playerColor = replay.playerColor;
    const opponentColor = getOpponentColor(playerColor);

    const playerName = getDisplayName(user);
    const opponentName = replay.opponent.username || 'Opponent';

    const playerAvatarUrl = getAvatarUrl(user);
    const opponentAvatarUrl = replay.opponent.avatarUrl;

    // Captured pieces.
    const playerCapturedPieces = getPiecesCapturedBy(
        playerColor,
        boardState.capturedWhitePieces,
        boardState.capturedBlackPieces,
    );

    const opponentCapturedPieces = getPiecesCapturedBy(
        opponentColor,
        boardState.capturedWhitePieces,
        boardState.capturedBlackPieces,
    );

    // Material advantage.
    const playerMaterialAdvantage = getMaterialAdvantage(
        playerColor,
        boardState.capturedWhitePieces,
        boardState.capturedBlackPieces,
    );

    const opponentMaterialAdvantage = getMaterialAdvantage(
        opponentColor,
        boardState.capturedWhitePieces,
        boardState.capturedBlackPieces,
    );

    // Static clock snapshot for the selected path.
    const clockSnapshot = getClockSnapshot(
        replay,
        selectedPath,
    );

    const playerRemainingMs =
        playerColor === 'WHITE'
            ? clockSnapshot.whiteRemainingMs
            : clockSnapshot.blackRemainingMs;

    const opponentRemainingMs =
        opponentColor === 'WHITE'
            ? clockSnapshot.whiteRemainingMs
            : clockSnapshot.blackRemainingMs;

    const isPositionFinished =
        selectedNode.gameResult.status !== 'IN_PROGRESS';

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------

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
                    {/* Small analysis header */}
                    <div className="
                        mb-2 flex shrink-0
                        flex-wrap items-center
                        justify-between gap-2
                    ">
                        <Link
                            to="/history"
                            className="
                                text-xs font-medium
                                text-slate-400 transition
                                hover:text-emerald-300
                            "
                        >
                            ← Back to game history
                        </Link>

                        <div className="
                            flex flex-wrap items-center
                            gap-2 text-[10px] text-slate-500
                        ">
                            <span>
                                {formatTimeControl(
                                    replay.baseSeconds,
                                    replay.incrementSeconds,
                                )}
                            </span>

                            <span>·</span>

                            <span>{replay.plyCount} plies</span>

                            <span>·</span>

                            <span>
                                Original result: {formatGameResult(replay.gameResult)}
                            </span>
                        </div>
                    </div>

                    {/* Same three-column structure as GamePage */}
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
                            flex h-10 w-full min-w-0
                            items-center gap-2
                            min-[951px]:hidden
                        ">
                            <GamePlayerCard
                                name={`${opponentName}`}
                                avatarUrl={opponentAvatarUrl}
                                capturedPieces={opponentCapturedPieces}
                                materialAdvantage={opponentMaterialAdvantage}
                                className="flex-1"
                            />

                            <GameClock
                                label="Opponent"
                                remainingMs={opponentRemainingMs}
                                turnStartTimeEpochMs={0}
                                serverTimeEpochMs={0}
                                isActive={false}
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
                                name={`${opponentName}`}
                                avatarUrl={opponentAvatarUrl}
                                capturedPieces={opponentCapturedPieces}
                                materialAdvantage={opponentMaterialAdvantage}
                            />

                            <div className="
                                flex min-h-0 flex-1
                                flex-col items-center
                                justify-center gap-3
                            ">
                                <GameClock
                                    label="Opponent"
                                    remainingMs={opponentRemainingMs}
                                    turnStartTimeEpochMs={0}
                                    serverTimeEpochMs={0}
                                    isActive={false}
                                />

                                <GameClock
                                    label="You"
                                    remainingMs={playerRemainingMs}
                                    turnStartTimeEpochMs={0}
                                    serverTimeEpochMs={0}
                                    isActive={false}
                                />
                            </div>

                            <GamePlayerCard
                                name={`${playerName}`}
                                avatarUrl={playerAvatarUrl}
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
                            <div className="w-full min-w-0">
                                <ChessBoard
                                    key={[
                                        selectedNode.id,
                                        boardResetVersion,
                                    ].join(':')}
                                    game={boardState}
                                    moveIndex={selectedNode.ply}
                                    playerColor={playerColor}
                                    isConnected={
                                        !isAnalyzing &&
                                        !isPositionFinished
                                    }
                                    allowAnySide
                                    onMove={analyzeSelectedMove}
                                />

                            </div>
                        </div>

                        {/* MOBILE: Current player */}
                        <div className="
                            flex h-10 w-full min-w-0
                            items-center gap-2
                            min-[951px]:hidden
                        ">
                            <GamePlayerCard
                                name={`${playerName}`}
                                avatarUrl={playerAvatarUrl}
                                capturedPieces={playerCapturedPieces}
                                materialAdvantage={playerMaterialAdvantage}
                                className="flex-1"
                            />

                            <GameClock
                                label="You"
                                remainingMs={playerRemainingMs}
                                turnStartTimeEpochMs={0}
                                serverTimeEpochMs={0}
                                isActive={false}
                            />
                        </div>

                        {/* Analysis move history */}
                        <div className="
                            min-w-0
                            min-[951px]:col-start-3
                            min-[951px]:row-start-1
                            min-[951px]:min-h-0
                        ">
                            <AnalysisMoveHistoryPanel
                                tree={tree}
                                selectedNodeId={workspace.selectedNodeId}
                                fullMoveNumber={boardState.fullMoveNumber}
                                isAnalyzing={isAnalyzing}
                                onSelectNode={selectNode}
                            />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};