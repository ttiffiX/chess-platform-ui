import React from 'react';

import type {
    AnalysisNode,
    AnalysisTree,
} from '../types/tree';

import type {
    AnalysisMoveLine,
} from '../utils/analysisMoveLine';

import {buildAnalysisMoveLine} from '../utils/analysisMoveLine';
import {getMainLineLeafId} from '../utils/analysisTree';

interface AnalysisMoveHistoryPanelProps {
    tree: AnalysisTree;
    selectedNodeId: string;
    fullMoveNumber: number;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

type MoveButtonVariant = 'main' | 'variation';

interface AnalysisMoveButtonProps {
    node: AnalysisNode;
    variant: MoveButtonVariant;
    isSelected: boolean;
    isLatestMainLine: boolean;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

const formatMove = (move: string | null): string => {
    if (!move) {
        return '';
    }

    const from = move.slice(0, 2);
    const to = move.slice(2, 4);

    const promotion = move.length === 5
        ? ` =${move[4].toUpperCase()}`
        : '';

    return `${from} → ${to}${promotion}`;
};

const getMoveNumber = (node: AnalysisNode): number => {
    return Math.ceil(node.ply / 2);
};

const isBlackMove = (node: AnalysisNode): boolean => {
    return node.ply % 2 === 0;
};

const AnalysisMoveButton: React.FC<AnalysisMoveButtonProps> = ({
                                                                   node,
                                                                   variant,
                                                                   isSelected,
                                                                   isLatestMainLine,
                                                                   isAnalyzing,
                                                                   onSelectNode,
                                                               }) => {
    const moveNumber = getMoveNumber(node);

    const colorMarker = isBlackMove(node)
        ? ' □'
        : ' ■';

    const selectedClass = isSelected
        ? variant === 'main' && isLatestMainLine
            ? 'bg-emerald-400/10'
            : 'bg-amber-400/15 ring-1 ring-amber-400/30'
        : variant === 'main'
            ? 'bg-slate-950 hover:bg-slate-800'
            : 'border border-sky-400/15 bg-slate-950/80 hover:bg-slate-800';

    if (variant === 'main') {
        return (
            <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => onSelectNode(node.id)}
                aria-pressed={isSelected}
                className={`
                    flex w-full min-w-0
                    items-center justify-between
                    gap-2 rounded-lg px-3 py-2
                    text-left transition
                    disabled:cursor-wait
                    ${selectedClass}
                `}
            >
                <span className="
                    shrink-0 font-mono
                    text-xs text-slate-500
                ">
                    {moveNumber}{colorMarker}
                </span>

                <span className="
                    min-w-0 truncate text-right
                    font-mono text-sm text-slate-200
                ">
                    {formatMove(node.move)}
                </span>

                {node.gameResult.status !== 'IN_PROGRESS' && (
                    <span
                        title={`Game ended: ${node.gameResult.status}`}
                        className="
                            shrink-0 rounded bg-amber-400/10
                            px-1.5 py-0.5 text-[9px]
                            font-bold text-amber-300
                        "
                    >
                        END
                    </span>
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => onSelectNode(node.id)}
            aria-pressed={isSelected}
            className={`
                flex shrink-0 items-center
                gap-1.5 rounded-md
                px-2 py-1.5 text-left
                transition
                disabled:cursor-wait
                ${selectedClass}
            `}
        >
            <span className="
                shrink-0 font-mono
                text-[10px] text-slate-500
            ">
                {moveNumber}{colorMarker}
            </span>

            <span className="
                whitespace-nowrap font-mono
                text-xs text-slate-200
            ">
                {formatMove(node.move)}
            </span>

            {node.gameResult.status !== 'IN_PROGRESS' && (
                <span className="
                    shrink-0 text-[9px]
                    font-bold text-amber-300
                ">
                    END
                </span>
            )}
        </button>
    );
};

/**
 * Render một variation line nằm ngang.
 *
 * Nếu một move trong line có variation tiếp theo,
 * variation đó được render ngay bên dưới move tương ứng.
 */
interface VariationLinesProps {
    lines: AnalysisMoveLine[];
    selectedNodeId: string;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

const VariationLines: React.FC<VariationLinesProps> = ({
                                                           lines,
                                                           selectedNodeId,
                                                           isAnalyzing,
                                                           onSelectNode,
                                                       }) => {
    if (lines.length === 0) {
        return null;
    }

    return (
        <div className="
            ml-3 space-y-1
            border-l border-sky-400/40
            py-1 pl-2
        ">
            {lines.map((line) => {
                const firstNode = line[0]?.node;

                if (!firstNode) {
                    return null;
                }

                return (
                    <div
                        key={firstNode.id}
                        className="
                            max-w-full
                            overflow-x-auto
                        "
                    >
                        <div className="
                            flex w-max min-w-full
                            items-start gap-1
                            pb-1
                        ">
                            {line.map((item) => (
                                <div
                                    key={item.node.id}
                                    className="
                                        flex shrink-0
                                        flex-col items-start
                                        gap-1
                                    "
                                >
                                    <AnalysisMoveButton
                                        node={item.node}
                                        variant="variation"
                                        isSelected={
                                            item.node.id === selectedNodeId
                                        }
                                        isLatestMainLine={false}
                                        isAnalyzing={isAnalyzing}
                                        onSelectNode={onSelectNode}
                                    />

                                    {item.variations.length > 0 && (
                                        <VariationLines
                                            lines={item.variations}
                                            selectedNodeId={selectedNodeId}
                                            isAnalyzing={isAnalyzing}
                                            onSelectNode={onSelectNode}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

interface MainLineMoveProps {
    item: AnalysisMoveLine[number];
    latestMainLineNodeId: string;
    selectedNodeId: string;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

const MainLineMove: React.FC<MainLineMoveProps> = ({
                                                       item,
                                                       latestMainLineNodeId,
                                                       selectedNodeId,
                                                       isAnalyzing,
                                                       onSelectNode,
                                                   }) => {
    return (
        <div className="space-y-1">
            <AnalysisMoveButton
                node={item.node}
                variant="main"
                isSelected={item.node.id === selectedNodeId}
                isLatestMainLine={
                    item.node.id === latestMainLineNodeId
                }
                isAnalyzing={isAnalyzing}
                onSelectNode={onSelectNode}
            />

            <VariationLines
                lines={item.variations}
                selectedNodeId={selectedNodeId}
                isAnalyzing={isAnalyzing}
                onSelectNode={onSelectNode}
            />
        </div>
    );
};

export const AnalysisMoveHistoryPanel: React.FC<
    AnalysisMoveHistoryPanelProps
> = ({
         tree,
         selectedNodeId,
         fullMoveNumber,
         isAnalyzing,
         onSelectNode,
     }) => {
    const root = tree.nodes[tree.rootNodeId];

    if (!root) {
        return null;
    }

    // Original main line luôn được ưu tiên làm line chính.
    // Nếu game chưa có nước nào và người dùng tự phân tích
    // từ vị trí đầu, lấy nhánh đầu tiên làm line hiển thị.
    const mainLineChildId =
        root.childIds.find(
            (childId) =>
                tree.nodes[childId]?.source === 'MAIN_LINE',
        ) ?? root.childIds[0];

    const mainLine = mainLineChildId
        ? buildAnalysisMoveLine(
            tree,
            mainLineChildId,
            true,
        )
        : [];

    const latestMainLineNodeId = getMainLineLeafId(tree);

    return (
        <aside className="
            flex h-full min-w-0 flex-col
            overflow-hidden rounded-2xl
            border border-slate-800
            bg-slate-900 p-3 sm:p-4
        ">
            {/* Header - same visual structure as MoveHistoryPanel */}
            <div className="
                flex shrink-0 min-w-0
                items-center justify-between gap-2
            ">
                <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                        Move history
                    </h2>

                    <p className="mt-0.5 text-[10px] text-slate-500">
                        Main line and variations
                    </p>
                </div>

                <span className="
                    shrink-0 rounded-lg bg-slate-800
                    px-3 py-1 text-xs font-medium text-slate-300
                ">
                    Move {fullMoveNumber}
                </span>
            </div>

            {/* Move list */}
            <div className="
                mt-3 min-h-[120px] flex-1
                space-y-1 overflow-y-auto pr-1
                max-h-[320px] min-[951px]:max-h-none
            ">
                {/* Starting position */}
                <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => onSelectNode(tree.rootNodeId)}
                    aria-pressed={selectedNodeId === tree.rootNodeId}
                    className={`
                        flex w-full min-w-0
                        items-center justify-between
                        gap-2 rounded-lg px-3 py-2
                        text-left transition
                        disabled:cursor-wait
                        ${
                        selectedNodeId === tree.rootNodeId
                            ? 'bg-amber-400/15 ring-1 ring-amber-400/30'
                            : 'bg-slate-950 hover:bg-slate-800'
                    }
                    `}
                >
                    <span className="
                        shrink-0 font-mono
                        text-xs text-slate-500
                    ">
                        Start
                    </span>

                    <span className="
                        min-w-0 truncate text-right
                        text-sm text-slate-300
                    ">
                        Starting position
                    </span>
                </button>

                {mainLine.length === 0 && (
                    <p className="py-4 text-sm text-slate-500">
                        No moves have been made yet.
                    </p>
                )}

                {mainLine.map((item) => (
                    <MainLineMove
                        key={item.node.id}
                        item={item}
                        latestMainLineNodeId={latestMainLineNodeId}
                        selectedNodeId={selectedNodeId}
                        isAnalyzing={isAnalyzing}
                        onSelectNode={onSelectNode}
                    />
                ))}
            </div>

            <div className="
                mt-3 shrink-0
                border-t border-slate-800 pt-3
            ">
                <p className="text-[10px] leading-4 text-slate-500">
                    Select any move to view its position.
                    New moves create variations without
                    changing the original game.
                </p>
            </div>
        </aside>
    );
};