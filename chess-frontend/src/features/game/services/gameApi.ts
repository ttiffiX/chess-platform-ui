import {client} from '../../../api/client';
import type {ApiResponse} from '../../../types/api';
import type {GameResponse} from '../types/game';

export const getGame = async (
    gameId: string,
): Promise<GameResponse> => {
    const response = await client.get<ApiResponse<GameResponse>>(
        `/games/${gameId}`,
    );

    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.message || 'Unable to load game.',
        );
    }

    return response.data.data;
};

export const getActiveGameId = async (): Promise<string | null> => {
    const response = await client.get<ApiResponse<string | null>>(
        '/games/active',
    );

    if (!response.data.success) {
        throw new Error(
            response.data.message || 'Unable to check active game.',
        );
    }

    return response.data.data ?? null;
};