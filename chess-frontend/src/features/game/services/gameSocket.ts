import {Client, type IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import {WS_BASE_URL} from '../../../config/env';
import type {GameStateResponse, PieceType} from '../types/game';

interface GameSocketHandlers {
    onConnected: () => void;
    onGameState: (state: GameStateResponse) => void;
    onError: (message: string) => void;
    onDisconnected: () => void;
}

interface CreateGameSocketParams {
    accessToken: string;
    gameId: string;
    handlers: GameSocketHandlers;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseGameState = (
    message: IMessage,
    expectedGameId: string,
): GameStateResponse | null => {
    try {
        const data: unknown = JSON.parse(message.body);

        if (
            !isRecord(data) ||
            data.gameId !== expectedGameId ||
            !isRecord(data.gameResult) ||
            !isRecord(data.board) ||
            !isRecord(data.legalMoves) ||
            !Array.isArray(data.historyItems) ||
            !['WHITE', 'BLACK'].includes(String(data.currentTurn))
        ) {
            return null;
        }

        return data as unknown as GameStateResponse;
    } catch {
        return null;
    }
};

const parseGameError = (message: IMessage): string => {
    try {
        const data: unknown = JSON.parse(message.body);

        if (typeof data === 'string') {
            return data;
        }

        if (isRecord(data) && typeof data.message === 'string') {
            return data.message;
        }
    } catch {
        // The server may send plain text.
    }

    return message.body.trim() || 'Unable to process your move.';
};

export const createGameSocket = ({
                                     accessToken,
                                     gameId,
                                     handlers,
                                 }: CreateGameSocketParams): Client => {
    const client = new Client({
        webSocketFactory: () =>
            new SockJS(WS_BASE_URL) as unknown as WebSocket,

        connectHeaders: {
            Authorization: `Bearer ${accessToken}`,
        },

        // Tự kết nối lại nếu mạng tạm thời bị gián đoạn.
        reconnectDelay: 3000,

        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,

        onConnect: () => {
            // Nhận trạng thái ván đấu sau mỗi nước đi.
            client.subscribe(`/topic/game/${gameId}`, (message) => {
                const gameState = parseGameState(message, gameId);

                if (!gameState) {
                    handlers.onError(
                        'Invalid game state received from server.',
                    );
                    return;
                }

                handlers.onGameState(gameState);
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