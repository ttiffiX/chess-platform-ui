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

interface MatchmakingState {
    accessToken: string | null;
    status: MatchmakingStatus;
    match: MatchFoundResponse | null;
    error: string | null;
}

export const useMatchmaking = (
    accessToken: string | null,
): UseMatchmakingResult => {
    const [matchmakingState, setMatchmakingState] =
        useState<MatchmakingState>({
            accessToken: null,
            status: 'IDLE',
            match: null,
            error: null,
        });

    const clientRef = useRef<Client | null>(null);
    const statusRef = useRef<MatchmakingStatus>('IDLE');

    // -------------------------------------------------------------------------
    // State helpers
    // -------------------------------------------------------------------------

    const updateStatus = useCallback((
        nextStatus: MatchmakingStatus,
    ) => {
        statusRef.current = nextStatus;

        setMatchmakingState((current) => {
            const belongsToCurrentSession =
                current.accessToken === accessToken;

            return {
                accessToken,
                status: nextStatus,
                match: belongsToCurrentSession
                    ? current.match
                    : null,
                error: belongsToCurrentSession
                    ? current.error
                    : null,
            };
        });
    }, [accessToken]);

    // -------------------------------------------------------------------------
    // Connection management
    // -------------------------------------------------------------------------

    const disconnect = useCallback(async () => {
        const client = clientRef.current;

        // Clear the ref before deactivating to ignore
        // onDisconnected from an intentional disconnect.
        clientRef.current = null;

        if (client) {
            await client.deactivate();
        }
    }, []);

    const handleError = useCallback((message: string) => {
        const currentStatus = statusRef.current;

        if (
            currentStatus === 'IDLE' ||
            currentStatus === 'MATCHED' ||
            currentStatus === 'ERROR'
        ) {
            return;
        }

        statusRef.current = 'ERROR';

        setMatchmakingState({
            accessToken,
            status: 'ERROR',
            match: null,
            error: message,
        });

        void disconnect();
    }, [accessToken, disconnect]);

    /**
     * Create a new matchmaking connection.
     *
     * If preset is provided, start searching after connection.
     * Otherwise, request the player's current matchmaking status.
     */
    const connect = useCallback((
        preset?: MatchmakingPreset,
    ) => {
        if (!accessToken) {
            return;
        }

        // A separate holder avoids referencing `client`
        // before its initialization is complete.
        const connection: { client: Client | null } = {
            client: null,
        };

        const isCurrentConnection = (): boolean => {
            return (
                connection.client !== null &&
                clientRef.current === connection.client
            );
        };

        const client = createMatchmakingSocket({
            handlers: {
                onConnected: (connectedClient) => {
                    if (
                        !isCurrentConnection() ||
                        connectedClient !== connection.client
                    ) {
                        return;
                    }

                    try {
                        if (preset) {
                            sendFindMatch(connectedClient, preset);
                        } else {
                            sendGetMatchStatus(connectedClient);
                        }
                    } catch (error) {
                        handleError(
                            error instanceof Error
                                ? error.message
                                : 'Unable to communicate with matchmaking server.',
                        );
                    }
                },

                onStatus: (serverStatus) => {
                    if (!isCurrentConnection()) {
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
                    if (!isCurrentConnection()) {
                        return;
                    }

                    statusRef.current = 'MATCHED';

                    setMatchmakingState({
                        accessToken,
                        status: 'MATCHED',
                        match: data,
                        error: null,
                    });

                    void disconnect();
                },

                onError: (message) => {
                    if (isCurrentConnection()) {
                        handleError(message);
                    }
                },

                onDisconnected: () => {
                    if (!isCurrentConnection()) {
                        return;
                    }

                    const currentStatus = statusRef.current;

                    if (
                        currentStatus !== 'IDLE' &&
                        currentStatus !== 'MATCHED' &&
                        currentStatus !== 'ERROR'
                    ) {
                        handleError(
                            'Connection to matchmaking server was closed.',
                        );
                    }
                },
            },
        });

        connection.client = client;
        clientRef.current = client;

        void client.activate();
    }, [
        accessToken,
        disconnect,
        handleError,
        updateStatus,
    ]);

    // -------------------------------------------------------------------------
    // Initial connection and queue restoration
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!accessToken) {
            statusRef.current = 'IDLE';
            return;
        }

        statusRef.current = 'CONNECTING';

        connect();

        return () => {
            const client = clientRef.current;
            clientRef.current = null;

            if (client) {
                void client.deactivate();
            }
        };
    }, [accessToken, connect]);

    // -------------------------------------------------------------------------
    // Matchmaking actions
    // -------------------------------------------------------------------------

    const findMatch = useCallback((
        preset: MatchmakingPreset,
    ) => {
        if (
            !accessToken ||
            statusRef.current !== 'IDLE'
        ) {
            return;
        }

        statusRef.current = 'CONNECTING';

        setMatchmakingState({
            accessToken,
            status: 'CONNECTING',
            match: null,
            error: null,
        });

        const client = clientRef.current;

        // Reuse the existing connection if available.
        if (client?.connected) {
            try {
                sendFindMatch(client, preset);
            } catch (error) {
                handleError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to start matchmaking.',
                );
            }

            return;
        }

        // Reconnect and send the find request after connection.
        void disconnect().then(() => {
            connect(preset);
        });
    }, [
        accessToken,
        connect,
        disconnect,
        handleError,
    ]);

    const cancelMatch = useCallback(() => {
        if (statusRef.current !== 'SEARCHING') {
            return;
        }

        const client = clientRef.current;

        if (!client?.connected) {
            handleError(
                'Matchmaking connection is no longer available.',
            );
            return;
        }

        try {
            updateStatus('CANCELLING');
            sendCancelMatch(client);
        } catch (error) {
            handleError(
                error instanceof Error
                    ? error.message
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

        statusRef.current = 'IDLE';

        setMatchmakingState({
            accessToken,
            status: 'IDLE',
            match: null,
            error: null,
        });

        void disconnect();
    }, [accessToken, disconnect]);

    // -------------------------------------------------------------------------
    // Derived state for the current authentication session
    // -------------------------------------------------------------------------

    const isCurrentSession =
        accessToken !== null &&
        matchmakingState.accessToken === accessToken;

    const status: MatchmakingStatus = !accessToken
        ? 'IDLE'
        : isCurrentSession
            ? matchmakingState.status
            : 'CONNECTING';

    const match = isCurrentSession
        ? matchmakingState.match
        : null;

    const error = isCurrentSession
        ? matchmakingState.error
        : null;

    return {
        status,
        match,
        error,
        findMatch,
        cancelMatch,
        resetMatch,
    };
};