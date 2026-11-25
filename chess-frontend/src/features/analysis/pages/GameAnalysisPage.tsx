import React from 'react';

import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/hooks/useAuth';
import {AppHeader} from '../../../components/layout/AppHeader';

import {ChessBoard} from '../../game/components/ChessBoard';

import {useGameAnalysis} from '../hooks/useGameAnalysis';
import {AnalysisMoveTree} from '../components/AnalysisMoveTree';

import {createAnalysisViewState} from '../utils/analysisView';
import {formatTimeControl} from "../../../utils/time.ts";
import {GAME_STATUS_LABELS} from "../../game/utils/gameResult.ts";
import type {GameResult} from "../../game/types/game.ts";

const formatGameResult = (
    gameResult: GameResult,
): string => {
    const label = GAME_STATUS_LABELS[gameResult.status];

    if (gameResult.winner) {
        return `${gameResult.winner} won · ${label}`;
    }

    return label;
};

export const GameAnalysisPage: React.FC = () => {
    const {gameId} = useParams<{ gameId: string }>();

    const {user, logout} = useAuth();

    const {
        status,
        error,
        replay,
        tree,
        workspace,
        selectedNode,
        isAnalyzing,
        analysisError,
        boardResetVersion,
        selectNode,
        analyzeSelectedMove,
    } = useGameAnalysis(gameId ?? null);

    // -------------------------------------------------------------------------
    // Loading
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Error
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Current analysis position
    // -------------------------------------------------------------------------

    const boardState = createAnalysisViewState(
        replay,
        workspace,
    );
    return (
        <div className="min-h-dvh bg-slate-950 text-white">
            <AppHeader
                user={user}
                onLogout={logout}
            />

            <main className="
                mx-auto max-w-[1500px]
                px-3 py-6 sm:px-6 sm:py-8
            ">
                {/* Page heading */}
                <section className="
                    mb-6 flex flex-col
                    gap-4 sm:flex-row
                    sm:items-end sm:justify-between
                ">
                    <div>
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

                        <h1 className="
                            mt-3 text-2xl font-bold
                            tracking-tight text-white
                            sm:text-3xl
                        ">
                            Game analysis
                        </h1>

                        <p className="mt-2 text-sm text-slate-400">
                            Review the original game and explore alternative moves.
                        </p>
                    </div>

                    <div className="
                        flex flex-wrap items-center gap-2
                    ">
                        <span className="
                            rounded-lg border border-slate-700
                            bg-slate-900 px-3 py-2
                            text-xs font-medium text-slate-300
                        ">
                            {formatTimeControl(
                                replay.baseSeconds,
                                replay.incrementSeconds,
                            )}
                        </span>

                        <span className="
                            rounded-lg border border-slate-700
                            bg-slate-900 px-3 py-2
                            text-xs font-medium text-slate-300
                        ">
                            {replay.plyCount} plies
                        </span>

                        <span className="
                            rounded-lg border border-slate-700
                            bg-slate-900 px-3 py-2
                            text-xs font-medium text-slate-300
                        ">
                            {formatGameResult(
                                replay.gameResult
                            )}
                        </span>
                    </div>
                </section>

                {/* Analysis layout */}
                <div className="
                    grid items-start gap-5
                    lg:grid-cols-[minmax(0,1fr)_360px]
                ">
                    {/* Board */}
                    <section className="
                        min-w-0 rounded-2xl
                        border border-slate-800
                        bg-slate-900/50 p-3
                        sm:p-5
                    ">
                        <div className="
                            mb-4 flex items-center
                            justify-between gap-3
                        ">
                            <div>
                                <p className="
                                    text-xs font-semibold
                                    uppercase tracking-wider
                                    text-emerald-300
                                ">
                                    Analysis board
                                </p>

                                <p className="
                                    mt-1 text-sm text-slate-400
                                ">
                                    {selectedNode.ply === 0
                                        ? 'Initial position'
                                        : `Ply ${selectedNode.ply}`
                                    }
                                    {' · '}
                                    {boardState.currentTurn === 'WHITE'
                                        ? 'White to move'
                                        : 'Black to move'
                                    }
                                </p>
                            </div>

                            {isAnalyzing && (
                                <span className="
                                    inline-flex items-center
                                    gap-2 text-xs
                                    text-amber-300
                                ">
                                    <span className="
                                        h-3 w-3 animate-spin
                                        rounded-full border-2
                                        border-amber-300/30
                                        border-t-amber-300
                                    "/>
                                    Analyzing...
                                </span>
                            )}
                        </div>

                        <div className="mx-auto w-full max-w-[720px]">
                            <ChessBoard
                                key={[
                                    selectedNode.id,
                                    boardResetVersion,
                                ].join(':')}
                                game={boardState}
                                moveIndex={selectedNode.ply}
                                playerColor="WHITE"
                                isConnected={!isAnalyzing}
                                allowAnySide
                                onMove={analyzeSelectedMove}
                            />
                        </div>

                        <div className="
                            mt-4 rounded-xl
                            border border-slate-800
                            bg-slate-950/60 p-3
                        ">
                            <p className="text-xs leading-5 text-slate-400">
                                Select a piece and destination square to
                                analyze an alternative move. The original
                                game history will remain unchanged.
                            </p>
                        </div>

                        {analysisError && (
                            <div className="
                                mt-3 rounded-xl
                                border border-rose-500/20
                                bg-rose-500/5 p-3
                            ">
                                <p className="text-sm text-rose-300">
                                    {analysisError}
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Move tree */}
                    <AnalysisMoveTree
                        tree={tree}
                        selectedNodeId={workspace.selectedNodeId}
                        isAnalyzing={isAnalyzing}
                        onSelectNode={selectNode}
                    />
                </div>

                {/* Original game information */}
                <section className="
                    mt-5 grid gap-3
                    sm:grid-cols-2
                ">
                    <div className="
                        rounded-xl border border-slate-800
                        bg-slate-900/50 p-4
                    ">
                        <p className="text-xs text-slate-500">
                            White player
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-200">
                            {replay.whitePlayerId}
                        </p>
                    </div>

                    <div className="
                        rounded-xl border border-slate-800
                        bg-slate-900/50 p-4
                    ">
                        <p className="text-xs text-slate-500">
                            Black player
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-200">
                            {replay.blackPlayerId}
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
};