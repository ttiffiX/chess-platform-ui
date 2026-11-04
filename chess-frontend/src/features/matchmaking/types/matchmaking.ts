export type MatchmakingPreset =
    | 'BLITZ_3_2'
    | 'RAPID_10_0'
    | 'RAPID_15_10';

export interface TimeControlOption {
    id: MatchmakingPreset;
    label: string;
    description: string;
    baseTimeSeconds: number;
    incrementSeconds: number;
}

export type MatchmakingStatus =
    | 'IDLE'
    | 'CONNECTING'
    | 'SEARCHING'
    | 'CANCELLING'
    | 'MATCHED'
    | 'ERROR';

export type MatchStatusEvent =
    | 'SEARCHING'
    | 'NOT_SEARCHING'
    | 'MATCHED'
    | 'CANCELLED';

export interface MatchFoundResponse {
    gameId: string;
    whitePlayerId: string;
    whitePlayerName: string | null;
    whitePlayerAvatar: string | null;
    blackPlayerId: string;
    blackPlayerName: string | null;
    blackPlayerAvatar: string | null;
    assignedColor: 'WHITE' | 'BLACK';
}