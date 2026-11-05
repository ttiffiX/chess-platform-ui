import React from 'react';
import type {PieceColor, PieceType} from '../types/game';

interface ChessPieceProps {
    type: PieceType;
    color: PieceColor;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({type, color,}) => {
    const isWhite = color === 'WHITE';

    const fill = isWhite ? '#F8F5EA' : '#293548';
    const stroke = isWhite ? '#64748B' : '#111827';
    const detail = isWhite ? '#FFFFFF' : '#8493A8';

    return (
        <svg
            viewBox="0 0 100 100"
            className="pointer-events-none h-[88%] w-[88%] select-none drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)]"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <g
                fill={fill}
                stroke={stroke}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Shared pedestal */}
                <path d="M30 78 Q50 83 70 78 L76 86 Q50 94 24 86 Z"/>
                <path d="M35 69 Q50 73 65 69 L70 79 Q50 84 30 79 Z"/>

                {type === 'PAWN' && (
                    <>
                        <circle cx="50" cy="24" r="10"/>
                        <path d="M43 36 Q43 45 38 52 L40 64 Q34 66 32 70 L68 70 Q66 66 60 64 L62 52 Q57 45 57 36 Z"/>
                    </>
                )}

                {type === 'ROOK' && (
                    <>
                        <path d="M32 17 H41 V27 H47 V17 H53 V27 H59 V17 H68 V39 H63 L61 68 H39 L37 39 H32 Z"/>
                        <path d="M40 43 H60 L58 64 H42 Z"/>
                    </>
                )}

                {type === 'KNIGHT' && (
                    <path d="
                        M29 70
                        L34 57
                        Q27 50 29 40
                        L39 31
                        L37 19
                        L51 25
                        Q65 24 72 36
                        L68 44
                        L75 52
                        L66 58
                        L65 70
                        Z
                        M39 32
                        L48 43
                        L61 39
                        L57 32
                        L47 29
                        Z
                    "/>
                )}

                {type === 'BISHOP' && (
                    <>
                        <path d="
                            M50 12
                            C60 22 65 29 63 38
                            C62 45 58 50 55 55
                            L62 68
                            H38
                            L45 55
                            C42 50 38 45 37 38
                            C35 29 40 22 50 12 Z
                        "/>
                        <path d="M43 36 L57 23" fill="none" stroke={detail} strokeWidth="4"/>
                    </>
                )}

                {type === 'QUEEN' && (
                    <>
                        <path d="
                            M31 24
                            L39 37
                            L50 17
                            L61 37
                            L69 24
                            L66 43
                            H34 Z
                        "/>
                        <circle cx="31" cy="22" r="4"/>
                        <circle cx="50" cy="14" r="4"/>
                        <circle cx="69" cy="22" r="4"/>
                        <path d="M35 45 Q50 51 65 45 L61 68 H39 Z"/>
                    </>
                )}

                {type === 'KING' && (
                    <>
                        <path d="M46 9 H54 V20 H65 V28 H54 V39 H46 V28 H35 V20 H46 Z"/>
                        <path d="
                            M39 43
                            Q50 49 61 43
                            L58 56
                            L65 68
                            H35
                            L42 56 Z
                        "/>
                    </>
                )}
            </g>

            {/* Subtle highlights */}
            <g
                fill="none"
                stroke={detail}
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity={isWhite ? 0.85 : 0.7}
            >
                <path d="M31 81 Q50 86 69 81"/>
                <path d="M38 72 Q50 75 62 72"/>
            </g>
        </svg>
    );
};
