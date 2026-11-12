import {Client, type IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import {
    getApiAccessToken,
    getFreshAccessToken,
} from '../../../api/client';

import {WS_BASE_URL} from '../../../config/env';
import {parseWebSocketError} from '../../../utils/websocket';

import type {
    GameResponse,
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
    onGameState: (state: GameResponse) => void;
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

const isPieceDto = (value: unknown): boolean => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        ['KING', 'QUEEN', 'ROOK', 'BISHOP', 'KNIGHT', 'PAWN']
            .includes(String(value.type)) &&
        ['WHITE', 'BLACK'].includes(String(value.color))
    );
};

const isPositionDto = (value: unknown): boolean => {
    return (
        isRecord(value) &&
        typeof value.file === 'string' &&
        /^[a-h]$/.test(value.file) &&
        typeof value.rank === 'number' &&
        Number.isInteger(value.rank) &&
        value.rank >= 1 &&
        value.rank <= 8
    );
};

const isMoveDto = (value: unknown): boolean => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isPositionDto(value.from) &&
        isPositionDto(value.to) &&
        (
            value.promotedPiece == null ||
            isPieceDto(value.promotedPiece)
        )
    );
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
            isMoveDto(value.move)
        ) &&
        (
            value.capturedPiece == null ||
            isPieceDto(value.capturedPiece)
        ) &&
        (
            value.moverClockAfterMs == null ||
            typeof value.moverClockAfterMs === 'number'
        )
    );
};

const isNullableNumber = (value: unknown): boolean => {
    return value === null || typeof value === 'number';
};

const parseGameResponse = (
    message: IMessage,
    expectedGameId: string,
): GameResponse | null => {
    try {
        const data: unknown = JSON.parse(message.body);

        if (
            !isRecord(data) ||
            data.gameId !== expectedGameId ||
            !isRecord(data.gameResult) ||
            typeof data.gameResult.status !== 'string' ||
            !(
                data.gameResult.winner === null ||
                ['WHITE', 'BLACK'].includes(String(data.gameResult.winner))
            ) ||
            typeof data.inCheck !== 'boolean' ||
            typeof data.fen !== 'string' ||
            !isRecord(data.legalMoves) ||
            !Array.isArray(data.historyItems) ||
            !data.historyItems.every(isGameHistoryRecord) ||
            !isNullableNumber(data.whiteRemainingMs) ||
            !isNullableNumber(data.blackRemainingMs) ||
            !isNullableNumber(data.turnStartTimeEpochMs) ||
            typeof data.serverTimeEpochMs !== 'number' ||
            typeof data.whitePlayerId !== 'string' ||
            typeof data.blackPlayerId !== 'string' ||
            !(
                data.drawOfferedBy === null ||
                ['WHITE', 'BLACK'].includes(String(data.drawOfferedBy))
            ) ||
            typeof data.stateVersion !== 'number' ||
            !Number.isInteger(data.stateVersion) ||
            typeof data.createdAt !== 'string'
        ) {
            return null;
        }

        return data as unknown as GameResponse;
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
            // Subscribe to game state.
            client.subscribe(`/topic/game/${gameId}`, (message) => {
                const gameState = parseGameResponse(message, gameId);

                if (!gameState) {
                    handlers.onError(
                        'Invalid game state received from server.',
                    );
                    return;
                }

                handlers.onGameState(gameState);
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