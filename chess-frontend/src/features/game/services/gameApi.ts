import {client} from '../../../api/client';
import type {ApiResponse} from '../../../types/api';
import type {GameResponse} from '../types/game';

// Chỉ gộp các request đang chạy đồng thời.
// Không cache kết quả lâu dài vì trạng thái game luôn thay đổi.
const pendingGameRequests = new Map<string, Promise<GameResponse>>();

export const getGame = (
    gameId: string,
): Promise<GameResponse> => {
    const existingRequest = pendingGameRequests.get(gameId);

    if (existingRequest) {
        return existingRequest;
    }

    const request: Promise<GameResponse> = client
        .get<ApiResponse<GameResponse>>(`/games/${gameId}`)
        .then((response) => {
            if (!response.data.success || !response.data.data) {
                throw new Error(
                    response.data.message || 'Unable to load game.',
                );
            }

            return response.data.data;
        })
        .finally(() => {
            if (pendingGameRequests.get(gameId) === request) {
                pendingGameRequests.delete(gameId);
            }
        });

    pendingGameRequests.set(gameId, request);

    return request;
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