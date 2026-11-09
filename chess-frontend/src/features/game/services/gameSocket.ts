import {Client, type IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import {
    getApiAccessToken,
    getFreshAccessToken,
} from '../../../api/client';

import {WS_BASE_URL} from '../../../config/env';

import type {
    GameStateResponse,
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
    onGameState: (state: GameStateResponse) => void;
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
            !Array.isArray(data.capturedWhitePieces) ||
            !Array.isArray(data.capturedBlackPieces) ||
            typeof data.stateVersion !== 'number' ||
            !Number.isInteger(data.stateVersion) ||
            typeof data.serverTimeEpochMs !== 'number' ||
            !['WHITE', 'BLACK'].includes(String(data.currentTurn))
        ) {
            return null;
        }

        return data as unknown as GameStateResponse;
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

        // Lấy token mới nhất trước mỗi lần CONNECT/reconnect.
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
                // Nếu refresh tạm thời thất bại, thử kết nối bằng
                // token hiện tại. Lần reconnect tiếp theo sẽ thử refresh lại.
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