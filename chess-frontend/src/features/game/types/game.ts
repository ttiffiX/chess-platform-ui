export type PieceColor = 'WHITE' | 'BLACK';

export type GameStatus =
    | 'IN_PROGRESS'
    | 'CHECKMATE'
    | 'STALEMATE'
    | 'DRAW_INSUFFICIENT_MATERIAL'
    | 'DRAW_FIFTY_MOVE_RULE'
    | 'DRAW_THREEFOLD_REPETITION'
    | 'DRAW_BY_AGREEMENT'
    | 'RESIGNED'
    | 'TIMED_OUT';

export type PieceType =
    | 'KING'
    | 'QUEEN'
    | 'ROOK'
    | 'BISHOP'
    | 'KNIGHT'
    | 'PAWN';

export interface PieceDto {
    type: PieceType;
    color: PieceColor;
}

export interface MoveHistoryDto {
    moveIndex: number;
    from: string;
    to: string;
}

export interface GameResult {
    status: GameStatus;
    winner: PieceColor | null;
}

export interface GameStateResponse {
    gameId: string;
    gameResult: GameResult;
    currentTurn: PieceColor;
    inCheck: boolean;
    fullMoveNumber: number;

    board: Record<string, PieceDto>;

    capturedWhitePieces: PieceDto[];
    capturedBlackPieces: PieceDto[];

    historyItems: MoveHistoryDto[];
    legalMoves: Record<string, string[]>;

    createdAt: string;

    whiteRemainingMs: number | null;
    blackRemainingMs: number | null;
    turnStartTimeEpochMs: number | null;

    whitePlayerId: string;
    blackPlayerId: string;

    drawOfferedBy: PieceColor | null;
}