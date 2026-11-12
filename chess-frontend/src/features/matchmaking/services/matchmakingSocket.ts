import {Client, type IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import {WS_BASE_URL} from '../../../config/env';
import {parseWebSocketError} from '../../../utils/websocket';

import type {
    MatchFoundResponse,
    MatchStatusEvent,
    MatchmakingPreset,
} from '../types/matchmaking';

interface MatchmakingSocketHandlers {
    onConnected: (client: Client) => void;
    onStatus: (status: MatchStatusEvent) => void;
    onMatchFound: (match: MatchFoundResponse) => void;
    onError: (message: string) => void;
    onDisconnected: () => void;
}

interface CreateMatchmakingSocketParams {
    accessToken: string;
    handlers: MatchmakingSocketHandlers;
}

const parseStatus = (body: string): MatchStatusEvent | null => {
    const value = body.trim().replace(/^"|"$/g, '');

    switch (value) {
        case 'SEARCHING':
        case 'NOT_SEARCHING':
        case 'MATCHED':
        case 'CANCELLED':
            return value;
        default:
            return null;
    }
};

const parseMatchFound = (
    message: IMessage,
): MatchFoundResponse | null => {
    try {
        const data = JSON.parse(message.body) as MatchFoundResponse;

        if (
            !data.gameId ||
            !data.assignedColor ||
            !['WHITE', 'BLACK'].includes(data.assignedColor)
        ) {
            return null;
        }

        return data;
    } catch {
        return null;
    }
};

export const createMatchmakingSocket = ({
                                            accessToken,
                                            handlers,
                                        }: CreateMatchmakingSocketParams): Client => {
    const client = new Client({
        webSocketFactory: () =>
            new SockJS(WS_BASE_URL) as unknown as WebSocket,

        connectHeaders: {
            Authorization: `Bearer ${accessToken}`,
        },

        reconnectDelay: 0,

        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,

        onConnect: () => {
            client.subscribe('/user/queue/match-status', (message) => {
                const status = parseStatus(message.body);

                if (status) {
                    handlers.onStatus(status);
                }
            });

            client.subscribe('/user/queue/match-found', (message) => {
                const match = parseMatchFound(message);

                if (match) {
                    handlers.onMatchFound(match);
                } else {
                    handlers.onError(
                        'Invalid match-found response received from server.',
                    );
                }
            });

            // Subscribe to user-specific WebSocket errors.
            client.subscribe('/user/queue/errors', (message) => {
                const errorMessage = parseWebSocketError(message.body);

                handlers.onError(
                    errorMessage ??
                    'An unexpected WebSocket error occurred.',
                );
            });

            handlers.onConnected(client);
        },

        onStompError: (frame) => {
            handlers.onError(
                frame.headers.message || 'WebSocket server error.',
            );
        },

        onWebSocketError: () => {
            handlers.onError('Unable to connect to matchmaking server.');
        },

        onWebSocketClose: () => {
            handlers.onDisconnected();
        },
    });

    return client;
};

export const sendFindMatch = (
    client: Client,
    preset: MatchmakingPreset,
): void => {
    if (!client.connected) {
        throw new Error('WebSocket is not connected.');
    }

    client.publish({
        destination: '/app/match/find',
        body: JSON.stringify({preset}),
    });
};

export const sendCancelMatch = (client: Client): void => {
    if (!client.connected) {
        throw new Error('WebSocket is not connected.');
    }

    client.publish({
        destination: '/app/match/cancel',
        body: '',
    });
};

export const sendGetMatchStatus = (client: Client): void => {
    if (!client.connected) {
        throw new Error('WebSocket is not connected.');
    }

    client.publish({
        destination: '/app/match/status',
        body: '',
    });
};