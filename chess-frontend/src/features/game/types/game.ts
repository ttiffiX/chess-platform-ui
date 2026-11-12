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

/**
 * Java Position record:
 * Position(char file, int rank)
 *
 * JSON:
 * { "file": "e", "rank": 2 }
 */
export interface PositionDto {
    file: string;
    rank: number;
}

/**
 * Java Move record:
 * Move(Position from, Position to, Piece promotedPiece)
 */
export interface MoveDto {
    from: PositionDto;
    to: PositionDto;
    promotedPiece: PieceDto | null;
}

/**
 * Java Record stored in GameSession.history.
 *
 * The first record represents the initial position:
 * move === null
 */
export interface GameHistoryRecordDto {
    move: MoveDto | null;
    fen: string;
    capturedPiece: PieceDto | null;
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
 * Response returned by REST and WebSocket.
 *
 * REST getGame():
 * historyItems contains the full history.
 *
 * WebSocket:
 * historyItems contains only the latest history record.
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
 * UI view model.
 *
 * This is not a backend DTO.
 * It is built from GameResponse + FEN + history.
 *
 * Keeping this shape allows ChessBoard and existing UI components
 * to remain mostly unchanged.
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