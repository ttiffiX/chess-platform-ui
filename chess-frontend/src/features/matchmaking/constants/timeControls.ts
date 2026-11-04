
import type { TimeControlOption } from '../types/matchmaking';

export const TIME_CONTROLS: TimeControlOption[] = [
    {
        id: 'BLITZ_3_2',
        label: '3 + 2',
        description: 'Blitz',
        baseTimeSeconds: 180,
        incrementSeconds: 2,
    },
    {
        id: 'RAPID_10_0',
        label: '10 + 0',
        description: 'Rapid',
        baseTimeSeconds: 600,
        incrementSeconds: 0,
    },
    {
        id: 'RAPID_15_10',
        label: '15 + 10',
        description: 'Classical',
        baseTimeSeconds: 900,
        incrementSeconds: 10,
    },
];

export const DEFAULT_TIME_CONTROL = 'RAPID_10_0';
