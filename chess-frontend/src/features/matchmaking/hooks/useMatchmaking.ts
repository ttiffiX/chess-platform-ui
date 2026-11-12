import {useCallback, useEffect, useRef, useState} from 'react';
import type {Client} from '@stomp/stompjs';

import type {
    MatchFoundResponse,
    MatchmakingPreset,
    MatchmakingStatus,
} from '../types/matchmaking';

import {
    createMatchmakingSocket,
    sendCancelMatch,
    sendFindMatch,
    sendGetMatchStatus,
} from '../services/matchmakingSocket';

interface UseMatchmakingResult {
    status: MatchmakingStatus;
    match: MatchFoundResponse | null;
    error: string | null;
    findMatch: (preset: MatchmakingPreset) => void;
    cancelMatch: () => void;
    resetMatch: () => void;
}

export const useMatchmaking = (
    accessToken: string | null,
): UseMatchmakingResult => {
    const [status, setStatus] = useState<MatchmakingStatus>('IDLE');
    const [match, setMatch] = useState<MatchFoundResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<Client | null>(null);
    const statusRef = useRef<MatchmakingStatus>('IDLE');

    const updateStatus = useCallback((next: MatchmakingStatus) => {
        statusRef.current = next;
        setStatus(next);
    }, []);

    const disconnect = useCallback(async () => {
        const client = clientRef.current;

        // Xóa ref trước khi deactivate để bỏ qua callback
        // onDisconnected của client đã chủ động đóng.
        clientRef.current = null;

        if (client) {
            await client.deactivate();
        }
    }, []);

    const handleError = useCallback((message: string) => {
        const current = statusRef.current;

        if (
            current === 'IDLE' ||
            current === 'MATCHED' ||
            current === 'ERROR'
        ) {
            return;
        }

        setError(message);
        updateStatus('ERROR');

        void disconnect();
    }, [disconnect, updateStatus]);

    /**
     * Tạo kết nối mới.
     *
     * preset được truyền vào khi kết nối để tìm trận.
     * Không truyền preset khi chỉ muốn hỏi trạng thái queue.
     */
    const connect = useCallback((
        preset?: MatchmakingPreset,
    ) => {
        if (!accessToken) {
            return;
        }

        let client: Client;

        client = createMatchmakingSocket({
            accessToken,
            handlers: {
                onConnected: (connectedClient) => {
                    if (clientRef.current !== client) {
                        return;
                    }

                    try {
                        if (preset) {
                            sendFindMatch(connectedClient, preset);
                        } else {
                            sendGetMatchStatus(connectedClient);
                        }
                    } catch (e) {
                        handleError(
                            e instanceof Error
                                ? e.message
                                : 'Unable to communicate with matchmaking server.',
                        );
                    }
                },

                onStatus: (serverStatus) => {
                    if (clientRef.current !== client) {
                        return;
                    }

                    switch (serverStatus) {
                        case 'SEARCHING':
                            if (statusRef.current !== 'CANCELLING') {
                                updateStatus('SEARCHING');
                            }
                            break;

                        case 'CANCELLED':
                        case 'NOT_SEARCHING':
                            if (
                                statusRef.current === 'CONNECTING' ||
                                statusRef.current === 'SEARCHING' ||
                                statusRef.current === 'CANCELLING'
                            ) {
                                updateStatus('IDLE');
                            }
                            break;

                        case 'MATCHED':
                            // Match details arrive on match-found.
                            break;
                    }
                },

                onMatchFound: (data) => {
                    if (clientRef.current !== client) {
                        return;
                    }

                    setMatch(data);
                    setError(null);
                    updateStatus('MATCHED');

                    void disconnect();
                },

                onError: (message) => {
                    if (clientRef.current === client) {
                        handleError(message);
                    }
                },

                onDisconnected: () => {
                    if (clientRef.current !== client) {
                        return;
                    }

                    const current = statusRef.current;

                    if (
                        current !== 'IDLE' &&
                        current !== 'MATCHED' &&
                        current !== 'ERROR'
                    ) {
                        handleError(
                            'Connection to matchmaking server was closed.',
                        );
                    }
                },
            },
        });

        clientRef.current = client;
        void client.activate();
    }, [
        accessToken,
        disconnect,
        handleError,
        updateStatus,
    ]);

    /**
     * Connect and restore queue status whenever the lobby mounts.
     */
    useEffect(() => {
        if (!accessToken) {
            updateStatus('IDLE');
            setMatch(null);
            setError(null);
            return;
        }

        setError(null);
        updateStatus('CONNECTING');

        connect();

        return () => {
            const client = clientRef.current;
            clientRef.current = null;

            if (client) {
                void client.deactivate();
            }
        };
    }, [accessToken, connect, updateStatus]);

    const findMatch = useCallback((preset: MatchmakingPreset) => {
        if (!accessToken || statusRef.current !== 'IDLE') {
            return;
        }

        setError(null);
        setMatch(null);
        updateStatus('CONNECTING');

        const client = clientRef.current;

        // Dùng lại kết nối đã được tạo khi kiểm tra queue.
        if (client?.connected) {
            try {
                sendFindMatch(client, preset);
            } catch (e) {
                handleError(
                    e instanceof Error
                        ? e.message
                        : 'Unable to start matchmaking.',
                );
            }

            return;
        }

        // Nếu socket đã mất kết nối, tạo kết nối mới
        // và gửi find request sau khi connect thành công.
        void disconnect().then(() => {
            connect(preset);
        });
    }, [
        accessToken,
        connect,
        disconnect,
        handleError,
        updateStatus,
    ]);

    const cancelMatch = useCallback(() => {
        if (statusRef.current !== 'SEARCHING') {
            return;
        }

        const client = clientRef.current;

        if (!client?.connected) {
            handleError('Matchmaking connection is no longer available.');
            return;
        }

        try {
            updateStatus('CANCELLING');
            sendCancelMatch(client);
        } catch (e) {
            handleError(
                e instanceof Error
                    ? e.message
                    : 'Unable to cancel matchmaking.',
            );
        }
    }, [handleError, updateStatus]);

    const resetMatch = useCallback(() => {
        if (
            statusRef.current !== 'MATCHED' &&
            statusRef.current !== 'ERROR'
        ) {
            return;
        }

        setMatch(null);
        setError(null);
        updateStatus('IDLE');

        void disconnect();
    }, [disconnect, updateStatus]);

    return {
        status,
        match,
        error,
        findMatch,
        cancelMatch,
        resetMatch,
    };
};