import type {
    GameEventResponse,
    GameHistoryRecordDto,
    GameResponse,
    GameResult,
    GameUpdateResponse,
    GameViewState,
    MoveHistoryDto,
    PieceColor,
    PieceDto,
    PieceType,
} from '../types/game';

import {parseFen} from './fen';

const PIECE_TYPE_BY_SYMBOL: Record<string, PieceType> = {
    k: 'KING',
    q: 'QUEEN',
    r: 'ROOK',
    b: 'BISHOP',
    n: 'KNIGHT',
    p: 'PAWN',
};

/**
 * Generate a stable key for a history record.
 *
 * Initial position:
 * fen|INITIAL
 *
 * Normal move:
 * fen|e2e4
 *
 * Promotion:
 * fen|e7e8q
 */
const getRecordKey = (record: GameHistoryRecordDto): string => {
    if (!record.move) {
        return `${record.fen}|INITIAL`;
    }

    return `${record.fen}|${record.move}`;
};

/**
 * Merge history from REST and WebSocket.
 *
 * REST:
 *   Full history.
 *
 * WebSocket:
 *   Only the latest history record.
 *
 * Duplicate records are ignored.
 */
export const mergeHistoryItems = (
    current: GameHistoryRecordDto[],
    incoming: GameHistoryRecordDto[],
): GameHistoryRecordDto[] => {
    if (incoming.length === 0) {
        return current;
    }

    // Incoming may be a complete history that extends current.
    const currentIsPrefix = current.every(
        (record, index) =>
            index < incoming.length &&
            getRecordKey(record) === getRecordKey(incoming[index]),
    );

    if (
        currentIsPrefix &&
        incoming.length >= current.length
    ) {
        return incoming;
    }

    // Otherwise append records that are not already present.
    const merged = [...current];
    const knownKeys = new Set(current.map(getRecordKey));

    for (const record of incoming) {
        const key = getRecordKey(record);

        if (!knownKeys.has(key)) {
            merged.push(record);
            knownKeys.add(key);
        }
    }

    return merged;
};

/**
 * Merge a full REST GameResponse into current state.
 *
 * stateVersion is the primary ordering mechanism.
 * serverTimeEpochMs resolves responses with the same version.
 */
export const mergeGameResponse = (
    current: GameResponse | null,
    incoming: GameResponse,
): GameResponse => {
    if (!current || current.gameId !== incoming.gameId) {
        return incoming;
    }

    if (incoming.stateVersion < current.stateVersion) {
        return current;
    }

    if (
        incoming.stateVersion === current.stateVersion &&
        incoming.serverTimeEpochMs <= current.serverTimeEpochMs
    ) {
        return current;
    }

    return {
        ...incoming,
        historyItems: mergeHistoryItems(
            current.historyItems,
            incoming.historyItems,
        ),
    };
};

/**
 * Merge a WebSocket GameUpdateResponse into the full frontend state.
 *
 * Backend historyItems is a single Record here,
 * so wrap it in an array before merging.
 */
export const mergeGameUpdateResponse = (
    current: GameResponse,
    incoming: GameUpdateResponse,
): GameResponse => {
    if (current.gameId !== incoming.gameId) {
        return current;
    }

    if (incoming.stateVersion < current.stateVersion) {
        return current;
    }

    if (
        incoming.stateVersion === current.stateVersion &&
        incoming.serverTimeEpochMs <= current.serverTimeEpochMs
    ) {
        return current;
    }

    const isGameOver =
        incoming.gameResult.status !== 'IN_PROGRESS';

    return {
        ...current,

        gameResult: incoming.gameResult,
        inCheck: incoming.inCheck,
        fen: incoming.fen,

        historyItems: mergeHistoryItems(
            current.historyItems,
            [incoming.historyItems],
        ),

        legalMoves: incoming.legalMoves,

        whiteRemainingMs: incoming.whiteRemainingMs,
        blackRemainingMs: incoming.blackRemainingMs,

        turnStartTimeEpochMs: incoming.turnStartTimeEpochMs,
        serverTimeEpochMs: incoming.serverTimeEpochMs,

        stateVersion: incoming.stateVersion,

        // A finished game cannot retain a pending draw offer.
        // GameUpdateResponse does not contain drawOfferedBy.
        drawOfferedBy: isGameOver
            ? null
            : current.drawOfferedBy,
    };
};

/**
 * Merge a minimal WebSocket GameEventResponse.
 *
 * Event response has no FEN, history, legal moves or clock data.
 * Preserve those fields and only update the event-related state.
 */
export const mergeGameEventResponse = (
    current: GameResponse,
    incoming: GameEventResponse,
): GameResponse => {
    if (current.gameId !== incoming.gameId) {
        return current;
    }

    if (incoming.stateVersion < current.stateVersion) {
        return current;
    }

    return {
        ...current,

        gameResult: incoming.gameResult,
        drawOfferedBy: incoming.drawOfferedBy,
        stateVersion: incoming.stateVersion,
    };
};

/**
 * Convert UCI history into the lightweight format used by MoveHistoryPanel.
 *
 * Backend history index:
 * 0 = initial position
 * 1 = first move
 * 2 = second move
 * ...
 */
export const toMoveHistoryItems = (
    records: GameHistoryRecordDto[],
): MoveHistoryDto[] => {
    return records.flatMap((record, index) => {
        const uci = record.move;

        if (!uci || uci.length < 4) {
            return [];
        }

        return [{
            moveIndex: index,
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
        }];
    });
};

export interface CapturedPiecesByColor {
    capturedWhitePieces: PieceDto[];
    capturedBlackPieces: PieceDto[];
}

/**
 * Convert backend FEN-style captured piece symbol into PieceDto.
 *
 * Q = white queen
 * q = black queen
 */
const toCapturedPieceDto = (
    symbol: string,
): PieceDto | null => {
    const type = PIECE_TYPE_BY_SYMBOL[symbol.toLowerCase()];

    if (!type) {
        return null;
    }

    return {
        type,
        color: symbol === symbol.toUpperCase()
            ? 'WHITE'
            : 'BLACK',
    };
};

/**
 * Derive captured pieces at a specific historical position.
 *
 * Each history record stores the piece captured by that move.
 * Index 0 is the initial position, so captures start at index 1.
 */
export const getCapturedPiecesAt = (
    records: GameHistoryRecordDto[],
    moveIndex: number,
): CapturedPiecesByColor => {
    const capturedWhitePieces: PieceDto[] = [];
    const capturedBlackPieces: PieceDto[] = [];

    const lastIndex = Math.min(
        moveIndex,
        records.length - 1,
    );

    for (let index = 1; index <= lastIndex; index += 1) {
        const capturedSymbol = records[index]?.capturedPiece;

        if (!capturedSymbol) {
            continue;
        }

        const capturedPiece = toCapturedPieceDto(capturedSymbol);

        if (!capturedPiece) {
            continue;
        }

        if (capturedPiece.color === 'WHITE') {
            capturedWhitePieces.push(capturedPiece);
        } else {
            capturedBlackPieces.push(capturedPiece);
        }
    }

    return {
        capturedWhitePieces,
        capturedBlackPieces,
    };
};

/**
 * Build the UI state from a full backend GameResponse.
 *
 * The selected history record provides the FEN for board rendering.
 * Legal moves are only available for the current live position.
 */
export const createGameViewState = (
    response: GameResponse,
    moveIndex: number,
    isReviewing: boolean,
): GameViewState => {
    const records = response.historyItems ?? [];
    const latestMoveIndex = Math.max(0, records.length - 1);

    const selectedMoveIndex = Math.min(
        Math.max(moveIndex, 0),
        latestMoveIndex,
    );

    const selectedRecord = records[selectedMoveIndex];

    const fen = selectedRecord?.fen ?? response.fen;
    const position = parseFen(fen);

    const capturedPieces = getCapturedPiecesAt(
        records,
        selectedMoveIndex,
    );

    const isLivePosition =
        !isReviewing &&
        selectedMoveIndex === latestMoveIndex;

    const gameResult: GameResult = isLivePosition
        ? response.gameResult
        : {
            status: 'IN_PROGRESS',
            winner: null,
        };

    return {
        gameId: response.gameId,
        gameResult,

        currentTurn: position.currentTurn,
        inCheck: isLivePosition
            ? response.inCheck
            : selectedRecord?.inCheck ?? false,
        fullMoveNumber: position.fullMoveNumber,

        board: position.board,

        capturedWhitePieces: capturedPieces.capturedWhitePieces,
        capturedBlackPieces: capturedPieces.capturedBlackPieces,

        historyItems: toMoveHistoryItems(records),
        legalMoves: isLivePosition
            ? response.legalMoves
            : {},

        createdAt: response.createdAt,

        whiteRemainingMs: response.whiteRemainingMs,
        blackRemainingMs: response.blackRemainingMs,

        turnStartTimeEpochMs: response.turnStartTimeEpochMs,
        serverTimeEpochMs: response.serverTimeEpochMs,

        whitePlayerId: response.whitePlayerId,
        blackPlayerId: response.blackPlayerId,

        drawOfferedBy: response.drawOfferedBy,
        stateVersion: response.stateVersion,
    };
};