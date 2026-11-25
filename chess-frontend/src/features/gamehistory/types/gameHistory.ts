import type {PieceColor, GameStatus} from '../../game/types/game';
import type {MatchmakingPreset} from '../../matchmaking/types/matchmaking';

export type GameOutcome = 'WIN' | 'LOSS' | 'DRAW';

export interface PlayerSummary {
    playerId: string;
    username: string;
    avatarUrl: string | null;
}

export interface GameHistoryItem {
    gameId: string;
    opponent: PlayerSummary;
    playerColor: PieceColor;
    gameStatus: GameStatus;
    outcome: GameOutcome;
    timeControlPreset: MatchmakingPreset;
    plyCount: number;
    startedAt: string;
    endedAt: string;
}

export interface PageMetadata {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
}

export interface PagedResponse<T> {
    content: T[];
    page: PageMetadata;
}