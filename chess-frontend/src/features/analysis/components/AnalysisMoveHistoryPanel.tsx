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

type ReviewIconType = 'first' | 'previous' | 'next' | 'latest';

interface AnalysisMoveButtonProps {
    node: AnalysisNode;
    variant: MoveButtonVariant;
    isSelected: boolean;
    isLatestMainLine: boolean;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

interface VariationLinesProps {
    lines: AnalysisMoveLine[];
    selectedNodeId: string;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

interface VariationLineProps {
    line: AnalysisMoveLine;
    selectedNodeId: string;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

interface MainLineMoveProps {
    item: AnalysisMoveLine[number];
    latestMainLineNodeId: string;
    selectedNodeId: string;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

interface ReviewIconProps {
    type: ReviewIconType;
}

/**
 * Approximate height of a variation button:
 * text line + vertical padding + borders.
 *
 * Keep this synchronized with AnalysisMoveButton's
 * variation button classes.
 */
const VARIATION_MOVE_HEIGHT = 30;
const VARIATION_TOP_GAP = 4;
const VARIATION_CONTAINER_PADDING = 8;
const VARIATION_LINE_GAP = 4;

/**
 * Get the maximum nested branch height below any move
 * in the same horizontal line.
 */
function getLineBranchHeight(
    line: AnalysisMoveLine,
): number {
    return line.reduce(
        (maximum, item) => Math.max(
            maximum,
            getVariationStackHeight(item.variations),
        ),
        0,
    );
}

/**
 * Calculate the vertical space consumed by all variations
 * attached to one move.
 *
 * Different variation lines are stacked vertically.
 */
function getVariationStackHeight(
    lines: AnalysisMoveLine[],
): number {
    if (lines.length === 0) {
        return 0;
    }

    const linesHeight = lines.reduce(
        (total, line, index) => {
            return total
                + (index > 0 ? VARIATION_LINE_GAP : 0)
                + VARIATION_MOVE_HEIGHT
                + getLineBranchHeight(line);
        },
        0,
    );

    return (
        VARIATION_TOP_GAP
        + VARIATION_CONTAINER_PADDING
        + linesHeight
    );
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

const getContinuationLeafId = (
    tree: AnalysisTree,
    startNodeId: string,
): string => {
    let currentNodeId = startNodeId;

    const visited = new Set<string>();

    while (!visited.has(currentNodeId)) {
        visited.add(currentNodeId);

        const currentNode = tree.nodes[currentNodeId];
        const nextNodeId = currentNode?.childIds[0];

        if (
            !nextNodeId ||
            !tree.nodes[nextNodeId]
        ) {
            break;
        }

        currentNodeId = nextNodeId;
    }

    return currentNodeId;
};

const ReviewIcon: React.FC<ReviewIconProps> = ({type}) => {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {type === 'first' && (
                <>
                    <path d="M5 5v14"/>
                    <path d="m19 5-7 7 7 7"/>
                </>
            )}

            {type === 'previous' && (
                <path d="m15 18-6-6 6-6"/>
            )}

            {type === 'next' && (
                <path d="m9 18 6-6-6-6"/>
            )}

            {type === 'latest' && (
                <>
                    <path d="M19 5v14"/>
                    <path d="m5 5 7 7-7 7"/>
                </>
            )}
        </svg>
    );
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
                border border-sky-400/15
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
 * A collection of sibling variations.
 * These lines are stacked vertically.
 */
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
            ml-3 w-full min-w-0 max-w-full
            border-l border-sky-400/40
            py-1 pl-2
        ">
            {lines.map((line, index) => {
                const firstNode = line[0]?.node;

                if (!firstNode) {
                    return null;
                }

                return (
                    <div
                        key={firstNode.id}
                        className={`
                            w-full min-w-0 max-w-full
                            overflow-x-auto overflow-y-hidden
                            ${index > 0 ? 'mt-1' : ''}
                        `}
                    >
                        <VariationLine
                            line={line}
                            selectedNodeId={selectedNodeId}
                            isAnalyzing={isAnalyzing}
                            onSelectNode={onSelectNode}
                        />
                    </div>
                );
            })}
        </div>
    );
};

/**
 * One horizontal variation line.
 *
 * Nested branches are absolutely positioned under their
 * corresponding move. They do not participate in the
 * horizontal flex layout of sibling moves.
 *
 * paddingBottom reserves vertical space for these branches
 * so that the following line does not overlap them.
 */
const VariationLine: React.FC<VariationLineProps> = ({
                                                         line,
                                                         selectedNodeId,
                                                         isAnalyzing,
                                                         onSelectNode,
                                                     }) => {
    const reservedHeight = getLineBranchHeight(line);

    return (
        <div
            className="
                 relative flex w-max min-w-full
                 items-start gap-1
            "
            style={{
                paddingBottom: `${reservedHeight}px`,
            }}
        >
            {line.map((item) => (
                <div
                    key={item.node.id}
                    className="relative shrink-0"
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
                        <div className="
                            absolute left-0 top-full
                            z-20 w-max pt-1
                        ">
                            <VariationLines
                                lines={item.variations}
                                selectedNodeId={selectedNodeId}
                                isAnalyzing={isAnalyzing}
                                onSelectNode={onSelectNode}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

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

    const selectedNode =
        tree.nodes[selectedNodeId] ?? root;

    const mainLineChildId = root.childIds.find(
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

    // Review navigation follows the currently selected line.
    const previousNodeId = selectedNode.parentId;
    const nextNodeId = selectedNode.childIds[0];

    const continuationLeafId = getContinuationLeafId(
        tree,
        selectedNode.id,
    );

    const reviewControls: {
        type: ReviewIconType;
        label: string;
        disabled: boolean;
        onClick: () => void;
    }[] = [
        {
            type: 'first',
            label: 'First move',
            disabled: selectedNode.id === root.id,
            onClick: () => onSelectNode(root.id),
        },
        {
            type: 'previous',
            label: 'Previous move',
            disabled: previousNodeId === null,
            onClick: () => {
                if (previousNodeId) {
                    onSelectNode(previousNodeId);
                }
            },
        },
        {
            type: 'next',
            label: 'Next move',
            disabled: !nextNodeId || !tree.nodes[nextNodeId],
            onClick: () => {
                if (nextNodeId && tree.nodes[nextNodeId]) {
                    onSelectNode(nextNodeId);
                }
            },
        },
        {
            type: 'latest',
            label: 'Latest move',
            disabled: continuationLeafId === selectedNode.id,
            onClick: () => onSelectNode(continuationLeafId),
        },
    ];

    return (
        <aside className="
            flex h-full min-w-0 flex-col
            overflow-hidden rounded-2xl
            border border-slate-800
            bg-slate-900 p-3 sm:p-4
        ">
            {/* Header */}
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
                  mt-3 min-h-[120px] min-w-0 flex-1
                  space-y-1 overflow-x-hidden overflow-y-auto pr-1
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

            {/* Review action bar */}
            <section className="
                mt-3 shrink-0
                border-t border-slate-700/70 pt-3
            ">
                <p className="
                    mb-2 text-[10px] font-semibold
                    uppercase tracking-wider text-slate-500
                ">
                    Review game
                </p>

                <div className="grid grid-cols-4 gap-2">
                    {reviewControls.map((control) => (
                        <button
                            key={control.type}
                            type="button"
                            title={control.label}
                            aria-label={control.label}
                            disabled={
                                isAnalyzing ||
                                control.disabled
                            }
                            onClick={control.onClick}
                            className="
                                flex h-10 items-center justify-center
                                rounded-lg border border-slate-700
                                bg-slate-950 text-slate-300
                                transition hover:bg-slate-800
                                disabled:cursor-not-allowed
                                disabled:opacity-35
                            "
                        >
                            <ReviewIcon type={control.type}/>
                        </button>
                    ))}
                </div>
            </section>
        </aside>
    );
};