import React from 'react';
import type {PieceColor, PieceType} from '../types/game';

interface ChessPieceProps {
    type: PieceType;
    color: PieceColor;
}

const pieceFile: Record<PieceType, string> = {
    KING: 'K',
    QUEEN: 'Q',
    ROOK: 'R',
    BISHOP: 'B',
    KNIGHT: 'N',
    PAWN: 'P',
};

export const ChessPiece: React.FC<ChessPieceProps> = ({
                                                          type,
                                                          color,
                                                      }) => {
    const prefix = color === 'WHITE' ? 'w' : 'b';
    const src = `/pieces/chessnut/${prefix}${pieceFile[type]}.svg`;

    return (
        <img
            src={src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="
                pointer-events-none
                h-[94%] w-[94%]
                select-none
                object-contain
            "
        />
    );
};