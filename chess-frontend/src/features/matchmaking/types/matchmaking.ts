
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
