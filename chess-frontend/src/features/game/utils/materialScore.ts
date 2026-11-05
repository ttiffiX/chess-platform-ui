import type {
    PieceColor,
    PieceDto,
    PieceType,
} from '../types/game';

const PIECE_VALUES: Record<PieceType, number> = {
    PAWN: 1,
    KNIGHT: 3,
    BISHOP: 3,
    ROOK: 5,
    QUEEN: 9,
    KING: 0,
};

export const getMaterialValue = (pieces: PieceDto[]): number => {
    return pieces.reduce(
        (total, piece) => total + PIECE_VALUES[piece.type],
        0,
    );
};

/**
 * Returns the pieces captured by the given player.
 * capturedWhitePieces: white pieces that were captured by black.
 * capturedBlackPieces: black pieces that were captured by white.
 */
export const getPiecesCapturedBy = (
    playerColor: PieceColor | null,
    capturedWhitePieces: PieceDto[],
    capturedBlackPieces: PieceDto[],
): PieceDto[] => {
    if (playerColor === 'WHITE') {
        return capturedBlackPieces;
    }

    if (playerColor === 'BLACK') {
        return capturedWhitePieces;
    }

    return [];
};

/**
 * Positive: player has material advantage.
 * Negative: player has material disadvantage.
 */
export const getMaterialAdvantage = (
    playerColor: PieceColor | null,
    capturedWhitePieces: PieceDto[],
    capturedBlackPieces: PieceDto[],
): number => {
    if (!playerColor) {
        return 0;
    }

    const whiteCapturedValue = getMaterialValue(capturedBlackPieces);
    const blackCapturedValue = getMaterialValue(capturedWhitePieces);

    const whiteAdvantage = whiteCapturedValue - blackCapturedValue;

    return playerColor === 'WHITE'
        ? whiteAdvantage
        : -whiteAdvantage;
};