import {client} from '../../../api/client';
import type {ApiResponse} from '../../../types/api';

import type {
    AnalyzeMoveRequest,
    GameAnalysisDto,
    GameReplayDto,
} from '../types/gameAnalysis';

export const getGameReplay = async (
    gameId: string,
): Promise<GameReplayDto> => {
    const response = await client.get<
        ApiResponse<GameReplayDto>
    >(`/games/${encodeURIComponent(gameId)}/analysis`);

    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.message || 'Unable to load game replay.',
        );
    }

    return response.data.data;
};

export const analyzeMove = async (
    request: AnalyzeMoveRequest,
): Promise<GameAnalysisDto> => {
    const response = await client.post<
        ApiResponse<GameAnalysisDto>
    >('/games/analysis/move', request);

    if (!response.data.success || !response.data.data) {
        throw new Error(
            response.data.message || 'Unable to analyze move.',
        );
    }

    return response.data.data;
};