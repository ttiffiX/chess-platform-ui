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

export interface GameHistoryRecordDto {
    /**
     * UCI format:
     * e2e4
     * e7e8q (promotion)
     *
     * null represents the initial position.
     */
    move: string | null;

    fen: string;

    /**
     * FEN-style piece symbol:
     * Q = white queen
     * q = black queen
     *
     * Backend omits this property when null.
     */
    capturedPiece?: string | null;

    inCheck: boolean;
    moverClockAfterMs: number | null;
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

/**
 * REST GET /games/{gameId}
 *
 * Contains the complete game state and full history.
 */
export interface GameResponse {
    gameId: string;
    gameResult: GameResult;
    inCheck: boolean;
    fen: string;

    historyItems: GameHistoryRecordDto[];
    legalMoves: Record<string, string[]>;

    whiteRemainingMs: number | null;
    blackRemainingMs: number | null;

    turnStartTimeEpochMs: number | null;
    serverTimeEpochMs: number;

    whitePlayerId: string;
    blackPlayerId: string;

    drawOfferedBy: PieceColor | null;

    stateVersion: number;
    createdAt: string;
}

/**
 * WebSocket response after makeMove.
 *
 * historyItems contains only the latest Record,
 * not the complete history.
 */
export interface GameUpdateResponse {
    gameId: string;
    gameResult: GameResult;
    inCheck: boolean;
    fen: string;

    historyItems: GameHistoryRecordDto;
    legalMoves: Record<string, string[]>;

    whiteRemainingMs: number | null;
    blackRemainingMs: number | null;

    turnStartTimeEpochMs: number | null;
    serverTimeEpochMs: number;

    stateVersion: number;
}

/**
 * WebSocket response for game actions:
 * resign, offerDraw, acceptDraw, declineDraw, claimTimeout.
 *
 * Backend may omit drawOfferedBy when its value is null.
 * The WebSocket parser normalizes omitted values to null.
 */
export interface GameEventResponse {
    gameId: string;
    gameResult: GameResult;
    drawOfferedBy: PieceColor | null;
    stateVersion: number;
}

export type GameSocketMessage =
    | GameUpdateResponse
    | GameEventResponse;

/**
 * Frontend view model.
 *
 * This is not a backend DTO.
 * It is built from GameResponse + FEN + history.
 */
export interface GameViewState {
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
    serverTimeEpochMs: number;

    whitePlayerId: string;
    blackPlayerId: string;

    drawOfferedBy: PieceColor | null;
    stateVersion: number;
}