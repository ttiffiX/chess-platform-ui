import type {
    GameViewState,
    PieceDto,
} from '../../game/types/game';

import type {
    AnalysisWorkspace,
} from '../types/tree';

import type {
    GameReplayDto,
} from '../types/gameAnalysis';

import {parseFen} from '../../game/utils/fen';
import {getAnalysisPath} from './analysisTree';
import {toCapturedPieceDto} from '../../game/utils/gameState';

export const createAnalysisViewState = (
    replay: GameReplayDto,
    workspace: AnalysisWorkspace,
    currentPlayerId: string,
): GameViewState => {
    const path = getAnalysisPath(
        workspace.tree,
        workspace.selectedNodeId,
    );

    if (path.length === 0) {
        throw new Error(
            'Unable to build the selected analysis position.',
        );
    }

    const selectedNode = path[path.length - 1];
    const position = parseFen(selectedNode.fen);

    const capturedWhitePieces: PieceDto[] = [];
    const capturedBlackPieces: PieceDto[] = [];

    for (const node of path) {
        if (!node.capturedPiece) {
            continue;
        }

        const captured = toCapturedPieceDto(node.capturedPiece);

        if (!captured) {
            continue;
        }

        if (captured.color === 'WHITE') {
            capturedWhitePieces.push(captured);
        } else {
            capturedBlackPieces.push(captured);
        }
    }

    const historyItems = path.slice(1).flatMap((node) => {
        if (!node.move) {
            return [];
        }

        return [{
            moveIndex: node.ply,
            from: node.move.slice(0, 2),
            to: node.move.slice(2, 4),
        }];
    });

    // Backend trả màu của người đang đăng nhập.
    // Từ đó suy ra hai player ID cho GameViewState.
    const whitePlayerId =
        replay.playerColor === 'WHITE'
            ? currentPlayerId
            : replay.opponent.playerId;

    const blackPlayerId =
        replay.playerColor === 'BLACK'
            ? currentPlayerId
            : replay.opponent.playerId;

    return {
        gameId: replay.gameId,

        // Kết quả phụ thuộc vào node đang xem.
        gameResult: selectedNode.gameResult,

        currentTurn: position.currentTurn,
        inCheck: selectedNode.inCheck,
        fullMoveNumber: position.fullMoveNumber,

        board: position.board,

        capturedWhitePieces,
        capturedBlackPieces,

        historyItems,
        legalMoves: selectedNode.legalMoves,

        createdAt: replay.startedAt,

        // Analysis clock không đếm ngược.
        whiteRemainingMs: null,
        blackRemainingMs: null,
        turnStartTimeEpochMs: null,
        serverTimeEpochMs: 0,

        whitePlayerId,
        blackPlayerId,

        drawOfferedBy: null,
        stateVersion: selectedNode.ply,
    };
};