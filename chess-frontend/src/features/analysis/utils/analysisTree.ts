import type {
    GameResult,
    GameStatus,
} from '../../game/types/game';

import type {
    GameAnalysisDto,
    GameReplayDto,
} from '../types/gameAnalysis';

import type {
    AnalysisNode,
    AnalysisTree,
} from '../types/tree';

const IN_PROGRESS_RESULT: GameResult = {
    status: 'IN_PROGRESS',
    winner: null,
};

const POSITION_TERMINAL_STATUSES = new Set<GameStatus>([
    'CHECKMATE',
    'STALEMATE',
    'DRAW_INSUFFICIENT_MATERIAL',
    'DRAW_FIFTY_MOVE_RULE',
    'DRAW_THREEFOLD_REPETITION',
]);

const isPositionTerminal = (
    result: GameResult,
): boolean => {
    return POSITION_TERMINAL_STATUSES.has(result.status);
};

/**
 * Generate a fingerprint of the original replay.
 *
 * If the original replay changes, previously saved variations
 * should not be attached to a different game history.
 */
export const createReplayFingerprint = (
    replay: GameReplayDto,
): string => {
    return JSON.stringify(
        replay.records.map((record) => [
            record.move,
            record.fen,
        ]),
    );
};

/**
 * Build the immutable main line from backend replay records.
 *
 * Record 0 is the initial position.
 * Record 1 is the position after ply 1.
 * Record N is the position after ply N.
 */
export const buildMainLineTree = (
    replay: GameReplayDto,
): AnalysisTree => {
    if (replay.records.length === 0) {
        throw new Error('Game replay contains no position records.');
    }

    const nodes: Record<string, AnalysisNode> = {};
    const lastIndex = replay.records.length - 1;

    replay.records.forEach((record, index) => {
        const id = `main-${index}`;

        nodes[id] = {
            id,
            parentId: index === 0
                ? null
                : `main-${index - 1}`,

            ply: index,
            move: record.move,

            fen: record.fen,
            capturedPiece: record.capturedPiece ?? null,
            inCheck: record.inCheck,

            legalMoves: record.legalMoves,

            gameResult: index === lastIndex &&
            isPositionTerminal(replay.gameResult)
                ? replay.gameResult
                : IN_PROGRESS_RESULT,

            moverClockAfterMs: record.moverClockAfterMs,

            source: 'MAIN_LINE',

            childIds: index < lastIndex
                ? [`main-${index + 1}`]
                : [],
        };
    });

    return {
        schemaVersion: 1,
        gameId: replay.gameId,
        replayFingerprint: createReplayFingerprint(replay),
        rootNodeId: 'main-0',
        nodes,
    };
};

export interface AppendAnalysisMoveResult {
    tree: AnalysisTree;
    nodeId: string;
    created: boolean;
}

/**
 * Add a new analysis position as a child of the selected position.
 *
 * If the same UCI move already exists under this parent,
 * reuse that node instead of creating a duplicate.
 */
export const appendAnalysisMove = (
    tree: AnalysisTree,
    parentNodeId: string,
    analysis: GameAnalysisDto,
    newNodeId: string,
): AppendAnalysisMoveResult => {
    const parent = tree.nodes[parentNodeId];

    if (!parent) {
        throw new Error('Analysis parent position does not exist.');
    }

    if (parent.gameResult.status !== 'IN_PROGRESS') {
        throw new Error(
            'Cannot create a variation from a finished position.',
        );
    }

    const existingChildId = parent.childIds.find((childId) => {
        return tree.nodes[childId]?.move === analysis.move;
    });

    if (existingChildId) {
        return {
            tree,
            nodeId: existingChildId,
            created: false,
        };
    }

    if (tree.nodes[newNodeId]) {
        throw new Error('Analysis node ID already exists.');
    }

    const newNode: AnalysisNode = {
        id: newNodeId,
        parentId: parentNodeId,
        ply: parent.ply + 1,

        move: analysis.move,
        fen: analysis.fen,
        capturedPiece: analysis.capturedPiece ?? null,
        inCheck: analysis.inCheck,

        legalMoves: analysis.legalMoves,
        gameResult: analysis.gameResult,

        moverClockAfterMs: null,

        source: 'VARIATION',
        childIds: [],
    };

    const updatedParent: AnalysisNode = {
        ...parent,
        childIds: [
            ...parent.childIds,
            newNodeId,
        ],
    };

    return {
        tree: {
            ...tree,
            nodes: {
                ...tree.nodes,
                [parentNodeId]: updatedParent,
                [newNodeId]: newNode,
            },
        },
        nodeId: newNodeId,
        created: true,
    };
};

/**
 * Return the path from the root position to a selected node.
 *
 * This is the active line that should be displayed on the board.
 */
export const getAnalysisPath = (
    tree: AnalysisTree,
    nodeId: string,
): AnalysisNode[] => {
    const path: AnalysisNode[] = [];
    const visited = new Set<string>();

    let current = tree.nodes[nodeId];

    while (current) {
        if (visited.has(current.id)) {
            return [];
        }

        visited.add(current.id);
        path.push(current);

        if (current.parentId === null) {
            break;
        }

        current = tree.nodes[current.parentId];
    }

    if (
        path.length === 0 ||
        path[path.length - 1].id !== tree.rootNodeId
    ) {
        return [];
    }

    return path.reverse();
};

/**
 * Get the final node of the original main line.
 */
export const getMainLineLeafId = (
    tree: AnalysisTree,
): string => {
    const mainLineNodes = Object.values(tree.nodes)
        .filter((node) => node.source === 'MAIN_LINE');

    return mainLineNodes.reduce(
        (latest, node) =>
            node.ply > latest.ply ? node : latest,
    ).id;
};