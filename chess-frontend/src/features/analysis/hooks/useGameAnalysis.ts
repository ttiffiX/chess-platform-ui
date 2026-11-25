import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import type {
    GameReplayDto,
    AnalyzeMoveRequest,
} from '../types/gameAnalysis';

import type {
    AnalysisNode,
    AnalysisWorkspace,
    AnalysisTree,
} from '../types/tree';

import {
    getGameReplay,
    analyzeMove as requestAnalyzeMove,
} from '../services/gameAnalysisApi';

import {
    appendAnalysisMove,
    buildMainLineTree,
    getAnalysisPath,
    getMainLineLeafId,
} from '../utils/analysisTree';

import type {
    PieceType,
    PromotionPieceType,
} from '../../game/types/game';

type AnalysisPageState =
    | {
    gameId: string;
    status: 'loading';
}
    | {
    gameId: string;
    status: 'error';
    error: string;
}
    | {
    gameId: string;
    status: 'ready';

    replay: GameReplayDto;
    workspace: AnalysisWorkspace;

    isAnalyzing: boolean;
    analysisError: string | null;

    boardResetVersion: number;
};

interface UseGameAnalysisResult {
    status: 'loading' | 'error' | 'ready';
    error: string | null;

    replay: GameReplayDto | null;
    tree: AnalysisTree | null;
    workspace: AnalysisWorkspace | null;

    selectedNode: AnalysisNode | null;
    selectedPath: AnalysisNode[];

    isAnalyzing: boolean;
    analysisError: string | null;
    boardResetVersion: number;

    selectNode: (nodeId: string) => void;

    analyzeSelectedMove: (
        from: string,
        to: string,
        promotionType?: PieceType,
    ) => boolean;
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

    return 'Something went wrong. Please try again.';
};

const isPromotionPieceType = (
    type: PieceType,
): type is PromotionPieceType => {
    return (
        type === 'QUEEN' ||
        type === 'ROOK' ||
        type === 'BISHOP' ||
        type === 'KNIGHT'
    );
};

const createNodeId = (): string => {
    return `variation-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
};

export const useGameAnalysis = (
    gameId: string | null,
): UseGameAnalysisResult => {
    const [pageState, setPageState] =
        useState<AnalysisPageState>({
            gameId: '',
            status: 'loading',
        });

    const requestSequenceRef = useRef(0);
    const requestInFlightRef = useRef(false);

    // -------------------------------------------------------------------------
    // Load replay
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!gameId) {
            return;
        }

        let cancelled = false;

        const loadReplay = async () => {
            try {
                const replay = await getGameReplay(gameId);

                if (cancelled) {
                    return;
                }

                const tree = buildMainLineTree(replay);

                const workspace: AnalysisWorkspace = {
                    tree,
                    selectedNodeId: getMainLineLeafId(tree),
                };

                setPageState({
                    gameId,
                    status: 'ready',
                    replay,
                    workspace,
                    isAnalyzing: false,
                    analysisError: null,
                    boardResetVersion: 0,
                });
            } catch (error) {
                if (!cancelled) {
                    setPageState({
                        gameId,
                        status: 'error',
                        error: getErrorMessage(error),
                    });
                }
            }
        };

        void loadReplay();

        return () => {
            cancelled = true;

            // Invalidate any analysis request belonging to the old page.
            requestSequenceRef.current += 1;
            requestInFlightRef.current = false;
        };
    }, [gameId]);

    // -------------------------------------------------------------------------
    // State belonging to the current route
    // -------------------------------------------------------------------------

    const currentState =
        pageState.gameId === gameId
            ? pageState
            : null;

    const status: UseGameAnalysisResult['status'] =
        !gameId
            ? 'error'
            : !currentState
                ? 'loading'
                : currentState.status;

    const error =
        !gameId
            ? 'Invalid game ID.'
            : currentState?.status === 'error'
                ? currentState.error
                : null;

    const readyState =
        currentState?.status === 'ready'
            ? currentState
            : null;

    const replay = readyState?.replay ?? null;
    const workspace = readyState?.workspace ?? null;
    const tree = workspace?.tree ?? null;

    const selectedNode = workspace
        ? tree?.nodes[workspace.selectedNodeId] ?? null
        : null;

    const selectedPath = workspace
        ? getAnalysisPath(
            workspace.tree,
            workspace.selectedNodeId,
        )
        : [];

    const isAnalyzing = readyState?.isAnalyzing ?? false;

    const analysisError = readyState?.analysisError ?? null;

    const boardResetVersion =
        readyState?.boardResetVersion ?? 0;

    // -------------------------------------------------------------------------
    // Select an existing node
    // -------------------------------------------------------------------------

    const selectNode = useCallback((nodeId: string) => {
        if (!gameId) {
            return;
        }

        setPageState((current) => {
            if (
                current.status !== 'ready' ||
                current.gameId !== gameId ||
                current.isAnalyzing ||
                !current.workspace.tree.nodes[nodeId]
            ) {
                return current;
            }

            return {
                ...current,
                workspace: {
                    ...current.workspace,
                    selectedNodeId: nodeId,
                },
                analysisError: null,
            };
        });
    }, [gameId]);

    // -------------------------------------------------------------------------
    // Analyze a move from the selected position
    // -------------------------------------------------------------------------

    const analyzeSelectedMove = useCallback((
        from: string,
        to: string,
        promotionType?: PieceType,
    ): boolean => {
        if (
            !gameId ||
            !readyState ||
            readyState.isAnalyzing ||
            requestInFlightRef.current
        ) {
            return false;
        }

        if (
            promotionType &&
            !isPromotionPieceType(promotionType)
        ) {
            return false;
        }

        const parentNodeId =
            readyState.workspace.selectedNodeId;

        const parentNode =
            readyState.workspace.tree.nodes[parentNodeId];

        if (!parentNode) {
            return false;
        }

        // Guard against invalid board actions.
        if (!parentNode.legalMoves[from]?.includes(to)) {
            return false;
        }

        const request: AnalyzeMoveRequest = {
            fen: parentNode.fen,
            move: {
                from,
                to,
                ...(promotionType
                    ? {promotionType}
                    : {}),
            },
        };

        const requestGameId = gameId;
        const requestId = ++requestSequenceRef.current;

        requestInFlightRef.current = true;

        setPageState((current) => {
            if (
                current.status !== 'ready' ||
                current.gameId !== requestGameId
            ) {
                return current;
            }

            return {
                ...current,
                isAnalyzing: true,
                analysisError: null,
            };
        });

        const executeAnalysis = async () => {
            try {
                const result = await requestAnalyzeMove(request);

                if (requestId !== requestSequenceRef.current) {
                    return;
                }

                const appendResult = appendAnalysisMove(
                    readyState.workspace.tree,
                    parentNodeId,
                    result,
                    createNodeId(),
                );

                setPageState((current) => {
                    if (
                        current.status !== 'ready' ||
                        current.gameId !== requestGameId
                    ) {
                        return current;
                    }

                    return {
                        ...current,
                        workspace: {
                            tree: appendResult.tree,
                            selectedNodeId: appendResult.nodeId,
                        },
                        isAnalyzing: false,
                        analysisError: null,
                    };
                });
            } catch (error) {
                if (requestId !== requestSequenceRef.current) {
                    return;
                }

                setPageState((current) => {
                    if (
                        current.status !== 'ready' ||
                        current.gameId !== requestGameId
                    ) {
                        return current;
                    }

                    return {
                        ...current,
                        isAnalyzing: false,
                        analysisError: getErrorMessage(error),

                        // Remount ChessBoard to clear its pending move.
                        boardResetVersion:
                            current.boardResetVersion + 1,
                    };
                });
            } finally {
                if (requestId === requestSequenceRef.current) {
                    requestInFlightRef.current = false;
                }
            }
        };

        void executeAnalysis();

        // ChessBoard uses a synchronous callback contract.
        // The actual API request continues asynchronously.
        return true;
    }, [gameId, readyState]);

    return {
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
    };
};