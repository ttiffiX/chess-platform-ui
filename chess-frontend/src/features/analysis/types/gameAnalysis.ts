import type {
    GameResult,
    PromotionPieceType,
} from '../../game/types/game';

export interface GameReplayRecordDto {
    /**
     * UCI move, for example e2e4.
     * null means the initial position.
     */
    move: string | null;

    fen: string;
    capturedPiece?: string | null;
    inCheck: boolean;
    moverClockAfterMs: number | null;
    legalMoves: Record<string, string[]>;
}

export interface GameReplayDto {
    gameId: string;

    whitePlayerId: string;
    blackPlayerId: string;

    gameResult: GameResult;

    baseSeconds: number;
    incrementSeconds: number;

    plyCount: number;

    startedAt: string;
    endedAt: string;

    records: GameReplayRecordDto[];
}

export interface AnalyzeMoveRequest {
    fen: string;

    move: {
        from: string;
        to: string;
        promotionType?: PromotionPieceType;
    };
}

export interface GameAnalysisDto {
    gameResult: GameResult;

    /**
     * UCI move returned by backend.
     */
    move: string;

    fen: string;
    capturedPiece?: string | null;
    inCheck: boolean;
    legalMoves: Record<string, string[]>;
}