import type {
    GameHistoryRecordDto,
    GameResponse,
    GameResult,
    GameViewState,
    MoveHistoryDto,
    PieceColor,
    PieceDto,
} from '../types/game';

import {parseFen} from './fen';

const positionToSquare = (
    position: { file: string; rank: number },
): string => {
    return `${position.file}${position.rank}`;
};

const getRecordKey = (record: GameHistoryRecordDto): string => {
    if (!record.move) {
        return `${record.fen}|INITIAL`;
    }

    const from = positionToSquare(record.move.from);
    const to = positionToSquare(record.move.to);

    const promotedPiece = record.move.promotedPiece
        ? `${record.move.promotedPiece.color}:${record.move.promotedPiece.type}`
        : '';

    return `${record.fen}|${from}-${to}|${promotedPiece}`;
};

/**
 * Merge history from REST and WebSocket.
 *
 * REST: full history.
 * WebSocket: only the latest record.
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

    // If incoming is a complete history and current is its prefix,
    // use the complete incoming list directly.
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

    // Otherwise, append only records that we do not already have.
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
 * Merge a REST / WebSocket response into current frontend state.
 *
 * stateVersion is the primary ordering mechanism.
 * serverTimeEpochMs is used when two responses have the same version.
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
 * Convert backend records into the lightweight format used by MoveHistoryPanel.
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
        if (!record.move) {
            return [];
        }

        return [{
            moveIndex: index,
            from: positionToSquare(record.move.from),
            to: positionToSquare(record.move.to),
        }];
    });
};

export interface CapturedPiecesByColor {
    capturedWhitePieces: PieceDto[];
    capturedBlackPieces: PieceDto[];
}

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
        const capturedPiece = records[index]?.capturedPiece;

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
 * Build the UI state from a backend GameResponse.
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