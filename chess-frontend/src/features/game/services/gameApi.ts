import {client} from '../../../api/client';
import type {ApiResponse} from '../../../types/api';
import type {GameStateResponse} from '../types/game';

export const getGame = async (
    gameId: string,
): Promise<GameStateResponse> => {
    const response = await client.get<ApiResponse<GameStateResponse>>(
        `/games/${gameId}`,
    );

    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.message || 'Unable to load game.',
        );
    }

    return response.data.data;
};

export const getGameSnapshotAt = async (
    gameId: string,
    moveIndex: number,
): Promise<GameStateResponse> => {
    const response = await client.get<ApiResponse<GameStateResponse>>(
        `/games/${gameId}/history/${moveIndex}`,
    );

    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.message || 'Unable to load game snapshot.',
        );
    }

    return response.data.data;
};