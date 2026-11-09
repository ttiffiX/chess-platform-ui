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