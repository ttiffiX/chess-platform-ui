import {Client, type IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import {
    getApiAccessToken,
    getFreshAccessToken,
} from '../../../api/client';

import {WS_BASE_URL} from '../../../config/env';
import {parseWebSocketError} from '../../../utils/websocket';

import type {
    GameResult,
    GameSocketMessage,
    PieceType,
} from '../types/game';

export type GameAction =
    | 'offerDraw'
    | 'acceptDraw'
    | 'declineDraw'
    | 'resign'
    | 'claimTimeout';

interface GameSocketHandlers {
    onConnected: () => void;
    onGameMessage: (message: GameSocketMessage) => void;
    onError: (message: string) => void;
    onDisconnected: () => void;
}

interface CreateGameSocketParams {
    gameId: string;
    handlers: GameSocketHandlers;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value);

const GAME_STATUSES = [
    'IN_PROGRESS',
    'CHECKMATE',
    'STALEMATE',
    'DRAW_INSUFFICIENT_MATERIAL',
    'DRAW_FIFTY_MOVE_RULE',
    'DRAW_THREEFOLD_REPETITION',
    'DRAW_BY_AGREEMENT',
    'RESIGNED',
    'TIMED_OUT',
];

const isGameResult = (value: unknown): value is GameResult => {
    if (
        !isRecord(value) ||
        !GAME_STATUSES.includes(String(value.status))
    ) {
        return false;
    }

    return (
        value.winner == null ||
        value.winner === 'WHITE' ||
        value.winner === 'BLACK'
    );
};

const isNullableNumber = (value: unknown): boolean => {
    return value === null || typeof value === 'number';
};

const isValidUciMove = (value: string): boolean => {
    return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(value);
};

const isValidCapturedPieceSymbol = (value: string): boolean => {
    return /^[KQRBNPkqrbnp]$/.test(value);
};

const isGameHistoryRecord = (value: unknown): boolean => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.fen === 'string' &&
        typeof value.inCheck === 'boolean' &&
        (
            value.move == null ||
            (
                typeof value.move === 'string' &&
                isValidUciMove(value.move)
            )
        ) &&
        (
            value.capturedPiece == null ||
            (
                typeof value.capturedPiece === 'string' &&
                isValidCapturedPieceSymbol(value.capturedPiece)
            )
        ) &&
        (
            value.moverClockAfterMs == null ||
            typeof value.moverClockAfterMs === 'number'
        )
    );
};

const isValidCommonResponse = (
    data: Record<string, unknown>,
    expectedGameId: string,
): boolean => {
    return (
        data.gameId === expectedGameId &&
        isGameResult(data.gameResult) &&
        typeof data.stateVersion === 'number' &&
        Number.isInteger(data.stateVersion)
    );
};

/**
 * GameUpdateResponse:
 * - has FEN and legal moves
 * - historyItems is a single Record
 * - has clock information
 */
const isGameUpdateResponse = (
    data: Record<string, unknown>,
    expectedGameId: string,
): boolean => {
    return (
        isValidCommonResponse(data, expectedGameId) &&
        typeof data.inCheck === 'boolean' &&
        typeof data.fen === 'string' &&
        isRecord(data.historyItems) &&
        isGameHistoryRecord(data.historyItems) &&
        isRecord(data.legalMoves) &&
        isNullableNumber(data.whiteRemainingMs) &&
        isNullableNumber(data.blackRemainingMs) &&
        isNullableNumber(data.turnStartTimeEpochMs) &&
        typeof data.serverTimeEpochMs === 'number'
    );
};

/**
 * GameEventResponse:
 * - no FEN
 * - no history
 * - no clock information
 * - drawOfferedBy may be omitted when null
 */
const isGameEventResponse = (
    data: Record<string, unknown>,
    expectedGameId: string,
): boolean => {
    return (
        isValidCommonResponse(data, expectedGameId) &&
        !('historyItems' in data) &&
        !('fen' in data) &&
        (
            data.drawOfferedBy == null ||
            data.drawOfferedBy === 'WHITE' ||
            data.drawOfferedBy === 'BLACK'
        )
    );
};

/**
 * Parse either GameUpdateResponse or GameEventResponse.
 *
 * The parser normalizes omitted drawOfferedBy to null.
 */
const parseGameSocketMessage = (
    message: IMessage,
    expectedGameId: string,
): GameSocketMessage | null => {
    try {
        const data: unknown = JSON.parse(message.body);

        if (
            !isRecord(data) ||
            data.gameId !== expectedGameId
        ) {
            return null;
        }

        if (isGameUpdateResponse(data, expectedGameId)) {
            return data as unknown as GameSocketMessage;
        }

        if (isGameEventResponse(data, expectedGameId)) {
            return {
                gameId: data.gameId as string,
                gameResult: data.gameResult as GameResult,

                drawOfferedBy:
                    data.drawOfferedBy === 'WHITE'
                        ? 'WHITE'
                        : data.drawOfferedBy === 'BLACK'
                            ? 'BLACK'
                            : null,

                stateVersion: data.stateVersion as number,
            };
        }

        return null;
    } catch {
        return null;
    }
};

export const createGameSocket = ({
                                     gameId,
                                     handlers,
                                 }: CreateGameSocketParams): Client => {
    const client = new Client({
        webSocketFactory: () =>
            new SockJS(WS_BASE_URL) as unknown as WebSocket,

        connectHeaders: {},

        beforeConnect: async () => {
            const fallbackToken = getApiAccessToken();

            try {
                const token = await getFreshAccessToken();

                client.connectHeaders = token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {};
            } catch {
                const token = getApiAccessToken() ?? fallbackToken;

                client.connectHeaders = token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {};
            }
        },

        reconnectDelay: 3000,

        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,

        onConnect: () => {
            // Subscribe to game updates and events.
            client.subscribe(`/topic/game/${gameId}`, (message) => {
                const gameMessage = parseGameSocketMessage(
                    message,
                    gameId,
                );

                if (!gameMessage) {
                    handlers.onError(
                        'Invalid game update received from server.',
                    );
                    return;
                }

                handlers.onGameMessage(gameMessage);
            });

            // Subscribe to user-specific WebSocket errors.
            client.subscribe('/user/queue/errors', (message) => {
                const errorMessage = parseWebSocketError(message.body);

                handlers.onError(
                    errorMessage ??
                    'An unexpected WebSocket error occurred.',
                );
            });

            handlers.onConnected();
        },

        onStompError: (frame) => {
            handlers.onError(
                frame.headers.message || 'WebSocket server error.',
            );
        },

        onWebSocketError: () => {
            handlers.onError(
                'Unable to connect to the game server.',
            );
        },

        onWebSocketClose: () => {
            handlers.onDisconnected();
        },
    });

    return client;
};

export const sendGameMove = (
    client: Client,
    gameId: string,
    from: string,
    to: string,
    promotionType?: PieceType,
): void => {
    if (!client.connected) {
        throw new Error('WebSocket is not connected.');
    }

    client.publish({
        destination: `/app/game/${gameId}/move`,
        body: JSON.stringify({
            from,
            to,
            ...(promotionType ? {promotionType} : {}),
        }),
    });
};

const ACTION_DESTINATIONS: Record<GameAction, string> = {
    offerDraw: 'draw/offer',
    acceptDraw: 'draw/accept',
    declineDraw: 'draw/decline',
    resign: 'resign',
    claimTimeout: 'timeout',
};

export const sendGameAction = (
    client: Client,
    gameId: string,
    action: GameAction,
): void => {
    if (!client.connected) {
        throw new Error('WebSocket is not connected.');
    }

    client.publish({
        destination: `/app/game/${gameId}/${ACTION_DESTINATIONS[action]}`,
        body: '',
    });
};