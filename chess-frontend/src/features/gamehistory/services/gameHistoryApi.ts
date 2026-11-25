import {client} from '../../../api/client';
import type {ApiResponse} from '../../../types/api';

import type {
    GameHistoryItem,
    PagedResponse,
} from '../types/gameHistory';

export const getGameHistory = async (
    page: number = 0,
): Promise<PagedResponse<GameHistoryItem>> => {

    const response = await client.get<
        ApiResponse<PagedResponse<GameHistoryItem>>
    >('/game-histories', {
        params: {
            page,
        },
    });

    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.message || 'Unable to load game history.',
        );
    }

    return response.data.data;
};