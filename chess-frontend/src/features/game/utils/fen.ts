import type {
    PieceColor,
    PieceDto,
    PieceType,
} from '../types/game';

export interface ParsedFen {
    board: Record<string, PieceDto>;
    currentTurn: PieceColor;
    fullMoveNumber: number;
}

const PIECE_TYPES: Record<string, PieceType> = {
    k: 'KING',
    q: 'QUEEN',
    r: 'ROOK',
    b: 'BISHOP',
    n: 'KNIGHT',
    p: 'PAWN',
};

/**
 * Convert FEN into frontend board representation.
 *
 * Example:
 * rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
 *
 * board:
 * {
 *   a8: { type: 'ROOK', color: 'BLACK' },
 *   ...
 *   e4: { type: 'PAWN', color: 'WHITE' }
 * }
 */
export const parseFen = (fen: string): ParsedFen => {
    if (typeof fen !== 'string' || !fen.trim()) {
        throw new Error('Invalid FEN: value must not be empty.');
    }

    const fields = fen.trim().split(/\s+/);

    if (fields.length !== 6) {
        throw new Error(`Invalid FEN: expected 6 fields, received ${fields.length}.`);
    }

    const [piecePlacement, activeColor, , , , fullMoveField] = fields;

    const ranks = piecePlacement.split('/');

    if (ranks.length !== 8) {
        throw new Error('Invalid FEN: board must contain exactly 8 ranks.');
    }

    const board: Record<string, PieceDto> = {};

    ranks.forEach((rankText, rowIndex) => {
        const rank = 8 - rowIndex;
        let fileIndex = 0;

        for (const symbol of rankText) {
            if (/^[1-8]$/.test(symbol)) {
                fileIndex += Number(symbol);
                continue;
            }

            const lowerSymbol = symbol.toLowerCase();
            const pieceType = PIECE_TYPES[lowerSymbol];

            if (!pieceType) {
                throw new Error(`Invalid FEN: unknown piece symbol '${symbol}'.`);
            }

            if (fileIndex >= 8) {
                throw new Error(`Invalid FEN: rank ${rank} contains too many squares.`);
            }

            const file = String.fromCharCode(97 + fileIndex);

            board[`${file}${rank}`] = {
                type: pieceType,
                color: symbol === symbol.toUpperCase()
                    ? 'WHITE'
                    : 'BLACK',
            };

            fileIndex += 1;
        }

        if (fileIndex !== 8) {
            throw new Error(`Invalid FEN: rank ${rank} does not contain 8 squares.`);
        }
    });

    let currentTurn: PieceColor;

    if (activeColor === 'w') {
        currentTurn = 'WHITE';
    } else if (activeColor === 'b') {
        currentTurn = 'BLACK';
    } else {
        throw new Error(`Invalid FEN: unknown active color '${activeColor}'.`);
    }

    const fullMoveNumber = Number(fullMoveField);

    if (
        !Number.isInteger(fullMoveNumber) ||
        fullMoveNumber < 1
    ) {
        throw new Error('Invalid FEN: full move number must be a positive integer.');
    }

    return {
        board,
        currentTurn,
        fullMoveNumber,
    };
};