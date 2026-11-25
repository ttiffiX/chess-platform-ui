import type {GameStatus} from "../types/game";

export const getGameResultDescription = (status: GameStatus): string => {
    switch (status) {
        case 'CHECKMATE':
            return 'The game ended by checkmate.';

        case 'STALEMATE':
            return 'The game ended in stalemate.';

        case 'DRAW_INSUFFICIENT_MATERIAL':
            return 'Neither player had enough material to checkmate.';

        case 'DRAW_FIFTY_MOVE_RULE':
            return 'The game ended by the fifty-move rule.';

        case 'DRAW_THREEFOLD_REPETITION':
            return 'The same position occurred three times.';

        case 'DRAW_BY_AGREEMENT':
            return 'Both players agreed to a draw.';

        case 'RESIGNED':
            return 'A player resigned.';

        case 'TIMED_OUT':
            return 'A player ran out of time.';

        default:
            return 'The game has ended.';
    }
};

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
    IN_PROGRESS: 'In progress',
    CHECKMATE: 'Checkmate',
    STALEMATE: 'Stalemate',

    DRAW_INSUFFICIENT_MATERIAL: 'Insufficient material',
    DRAW_FIFTY_MOVE_RULE: '50-move rule',
    DRAW_THREEFOLD_REPETITION: 'Threefold repetition',
    DRAW_BY_AGREEMENT: 'Draw by agreement',

    RESIGNED: 'Resignation',
    TIMED_OUT: 'Time out',
};