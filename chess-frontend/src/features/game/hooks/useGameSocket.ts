import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import type {Client} from '@stomp/stompjs';

import type {
    GameSocketMessage,
    PieceType,
} from '../types/game';

import {
    createGameSocket,
    sendGameAction,
    sendGameMove,
    type GameAction,
} from '../services/gameSocket';

interface UseGameSocketParams {
    gameId: string | null;
    enabled: boolean;
    onGameMessage: (message: GameSocketMessage) => void;
}

interface UseGameSocketResult {
    isConnected: boolean;
    error: string | null;

    sendMove: (
        from: string,
        to: string,
        promotionType?: PieceType,
    ) => boolean;

    offerDraw: () => boolean;
    acceptDraw: () => boolean;
    declineDraw: () => boolean;
    resign: () => boolean;
    claimTimeout: () => boolean;
}

interface GameSocketState {
    gameId: string | null;
    isConnected: boolean;
    error: string | null;
}

export const useGameSocket = ({
                                  gameId,
                                  enabled,
                                  onGameMessage,
                              }: UseGameSocketParams): UseGameSocketResult => {
    const [socketState, setSocketState] =
        useState<GameSocketState>({
            gameId: null,
            isConnected: false,
            error: null,
        });

    const clientRef = useRef<Client | null>(null);
    const onGameMessageRef = useRef(onGameMessage);

    // Keep the latest message handler without accessing refs during render.
    useEffect(() => {
        onGameMessageRef.current = onGameMessage;
    }, [onGameMessage]);

    const updateSocketError = useCallback((message: string) => {
        setSocketState((current) => ({
            gameId,
            isConnected:
                current.gameId === gameId
                    ? current.isConnected
                    : false,
            error: message,
        }));
    }, [gameId]);

    const clearSocketError = useCallback(() => {
        setSocketState((current) => ({
            gameId,
            isConnected:
                current.gameId === gameId
                    ? current.isConnected
                    : false,
            error: null,
        }));
    }, [gameId]);

    useEffect(() => {
        if (!enabled || !gameId) {
            return;
        }

        let active = true;

        const client = createGameSocket({
            gameId,
            handlers: {
                onConnected: () => {
                    if (!active) return;

                    setSocketState({
                        gameId,
                        isConnected: true,
                        error: null,
                    });
                },

                onGameMessage: (message) => {
                    if (!active) return;

                    onGameMessageRef.current(message);
                },

                onError: (message) => {
                    if (!active) return;

                    updateSocketError(message);
                },

                onDisconnected: () => {
                    if (!active) return;

                    setSocketState({
                        gameId,
                        isConnected: false,
                        error: 'Connection interrupted. Reconnecting...',
                    });
                },
            },
        });

        clientRef.current = client;
        void client.activate();

        return () => {
            active = false;

            if (clientRef.current === client) {
                clientRef.current = null;
            }

            void client.deactivate();
        };
    }, [
        enabled,
        gameId,
        updateSocketError,
    ]);

    const sendMove = useCallback((
        from: string,
        to: string,
        promotionType?: PieceType,
    ): boolean => {
        const client = clientRef.current;

        if (!client?.connected || !gameId) {
            updateSocketError('Game connection is not ready.');
            return false;
        }

        try {
            clearSocketError();

            sendGameMove(
                client,
                gameId,
                from,
                to,
                promotionType,
            );

            return true;
        } catch (err) {
            updateSocketError(
                err instanceof Error
                    ? err.message
                    : 'Unable to send move.',
            );

            return false;
        }
    }, [
        gameId,
        clearSocketError,
        updateSocketError,
    ]);

    const sendAction = useCallback((
        action: GameAction,
    ): boolean => {
        const client = clientRef.current;

        if (!client?.connected || !gameId) {
            updateSocketError('Game connection is not ready.');
            return false;
        }

        try {
            clearSocketError();

            sendGameAction(client, gameId, action);

            return true;
        } catch (err) {
            updateSocketError(
                err instanceof Error
                    ? err.message
                    : 'Unable to send game action.',
            );

            return false;
        }
    }, [
        gameId,
        clearSocketError,
        updateSocketError,
    ]);

    const offerDraw = useCallback(
        () => sendAction('offerDraw'),
        [sendAction],
    );

    const acceptDraw = useCallback(
        () => sendAction('acceptDraw'),
        [sendAction],
    );

    const declineDraw = useCallback(
        () => sendAction('declineDraw'),
        [sendAction],
    );

    const resign = useCallback(
        () => sendAction('resign'),
        [sendAction],
    );

    const claimTimeout = useCallback(
        () => sendAction('claimTimeout'),
        [sendAction],
    );

    // Ignore the previous game's connection state.
    const isCurrentGame =
        enabled &&
        gameId !== null &&
        socketState.gameId === gameId;

    return {
        isConnected: isCurrentGame && socketState.isConnected,
        error: isCurrentGame ? socketState.error : null,
        sendMove,
        offerDraw,
        acceptDraw,
        declineDraw,
        resign,
        claimTimeout,
    };
};