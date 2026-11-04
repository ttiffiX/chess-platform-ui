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

        const client = clientRef.current;
        clientRef.current = null;

        if (client) {
            void client.deactivate();
        }
    }, [updateStatus]);

    const findMatch = useCallback((preset: MatchmakingPreset) => {
        if (!accessToken || statusRef.current !== 'IDLE') {
            return;
        }

        setError(null);
        setMatch(null);
        updateStatus('CONNECTING');

        const client = createMatchmakingSocket({
            accessToken,
            handlers: {
                onConnected: (connectedClient) => {
                    try {
                        sendFindMatch(connectedClient, preset);
                    } catch (e) {
                        handleError(
                            e instanceof Error
                                ? e.message
                                : 'Unable to start matchmaking.',
                        );
                    }
                },

                onStatus: (serverStatus) => {
                    switch (serverStatus) {
                        case 'SEARCHING':
                            if (statusRef.current === 'CONNECTING') {
                                updateStatus('SEARCHING');
                            }
                            break;

                        case 'CANCELLED':
                        case 'NOT_SEARCHING':
                            if (statusRef.current === 'CANCELLING') {
                                updateStatus('IDLE');
                                void disconnect();
                            }
                            break;

                        case 'MATCHED':
                            // Match details arrive on match-found.
                            break;
                    }
                },

                onMatchFound: (data) => {
                    setMatch(data);
                    setError(null);
                    updateStatus('MATCHED');
                    void disconnect();
                },

                onError: handleError,

                onDisconnected: () => {
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
        client.activate();
    }, [
        accessToken,
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

    useEffect(() => {
        return () => {
            const client = clientRef.current;
            clientRef.current = null;

            if (client) {
                void client.deactivate();
            }
        };
    }, []);

    return {
        status,
        match,
        error,
        findMatch,
        cancelMatch,
        resetMatch,
    };
};