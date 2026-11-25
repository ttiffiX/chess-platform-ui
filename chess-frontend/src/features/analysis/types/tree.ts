import type {GameResult} from '../../game/types/game';

export type AnalysisNodeSource =
    | 'MAIN_LINE'
    | 'VARIATION';

export interface AnalysisNode {
    id: string;
    parentId: string | null;

    /**
     * Number of plies from the initial position.
     * Root position has ply = 0.
     */
    ply: number;

    /**
     * UCI move that leads to this position.
     * Root has move = null.
     */
    move: string | null;

    fen: string;
    capturedPiece: string | null;
    inCheck: boolean;

    legalMoves: Record<string, string[]>;

    gameResult: GameResult;
    moverClockAfterMs: number | null;

    source: AnalysisNodeSource;

    /**
     * All possible next moves from this position.
     */
    childIds: string[];
}

export interface AnalysisTree {
    schemaVersion: 1;
    gameId: string;

    /**
     * Identifies the exact original replay used to build this tree.
     */
    replayFingerprint: string;

    rootNodeId: string;

    /**
     * Nodes are stored by ID for efficient lookup.
     */
    nodes: Record<string, AnalysisNode>;
}

export interface AnalysisWorkspace {
    tree: AnalysisTree;

    /**
     * Currently selected position.
     */
    selectedNodeId: string;
}