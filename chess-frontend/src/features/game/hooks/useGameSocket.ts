import {useCallback, useEffect, useRef, useState} from 'react';
import type {Client} from '@stomp/stompjs';

import type {GameStateResponse, PieceType} from '../types/game';

import {
    createGameSocket,
    sendGameMove,
} from '../services/gameSocket';

interface UseGameSocketParams {
    accessToken: string | null;
    gameId: string | null;
    enabled: boolean;
    onGameState: (state: GameStateResponse) => void;
}

interface UseGameSocketResult {
    isConnected: boolean;
    error: string | null;
    sendMove: (
        from: string,
        to: string,
        promotionType?: PieceType,
    ) => boolean;
}

export const useGameSocket = ({
                                  accessToken,
                                  gameId,
                                  enabled,
                                  onGameState,
                              }: UseGameSocketParams): UseGameSocketResult => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<Client | null>(null);
    const onGameStateRef = useRef(onGameState);

    // Luôn sử dụng callback mới nhất mà không phải reconnect socket.
    onGameStateRef.current = onGameState;

    useEffect(() => {
        if (!enabled || !accessToken || !gameId) {
            setIsConnected(false);
            return;
        }

        let active = true;

        setIsConnected(false);
        setError(null);

        const client = createGameSocket({
            accessToken,
            gameId,
            handlers: {
                onConnected: () => {
                    if (!active) return;

                    setIsConnected(true);
                    setError(null);
                },

                onGameState: (state) => {
                    if (!active) return;

                    onGameStateRef.current(state);
                },

                onError: (message) => {
                    if (!active) return;

                    setError(message);
                },

                onDisconnected: () => {
                    if (!active) return;

                    setIsConnected(false);
                    setError((current) =>
                        current ?? 'Connection interrupted. Reconnecting...',
                    );
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
    }, [accessToken, enabled, gameId]);

    const sendMove = useCallback((
        from: string,
        to: string,
        promotionType?: PieceType,
    ): boolean => {
        const client = clientRef.current;

        if (!client?.connected || !gameId) {
            setError('Game connection is not ready.');
            return false;
        }

        try {
            setError(null);

            sendGameMove(
                client,
                gameId,
                from,
                to,
                promotionType,
            );

            return true;
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to send move.',
            );

            return false;
        }
    }, [gameId]);

    return {
        isConnected,
        error,
        sendMove,
    };
};