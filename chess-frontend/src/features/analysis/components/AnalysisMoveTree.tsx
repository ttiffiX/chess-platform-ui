import React from 'react';

import type {
    AnalysisTree,
} from '../types/tree';

interface AnalysisMoveTreeProps {
    tree: AnalysisTree;
    selectedNodeId: string;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

interface TreeNodeProps {
    tree: AnalysisTree;
    nodeId: string;
    selectedNodeId: string;
    isAnalyzing: boolean;
    onSelectNode: (nodeId: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
                                               tree,
                                               nodeId,
                                               selectedNodeId,
                                               isAnalyzing,
                                               onSelectNode,
                                           }) => {
    const node = tree.nodes[nodeId];

    if (!node) {
        return null;
    }

    const isSelected = node.id === selectedNodeId;
    const isRoot = node.ply === 0;

    const moveNumber = Math.ceil(node.ply / 2);

    const movePrefix = node.ply % 2 === 1
        ? `${moveNumber}.`
        : `${moveNumber}...`;

    const moveLabel = node.move
        ? `${node.move.slice(0, 2)} → ${node.move.slice(2, 4)}${
            node.move.length === 5
                ? ` =${node.move[4].toUpperCase()}`
                : ''
        }`
        : 'Starting position';

    return (
        <div>
            <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => onSelectNode(node.id)}
                aria-current={isSelected ? 'step' : undefined}
                className={`
                    flex w-full min-w-0
                    items-center gap-2 rounded-lg
                    px-3 py-2 text-left
                    transition-colors
                    disabled:cursor-wait disabled:opacity-50
                    ${
                    isSelected
                        ? 'bg-emerald-400/15 ring-1 ring-emerald-400/30'
                        : 'hover:bg-slate-800'
                }
                `}
            >
                <span className="
                    min-w-0 flex-1 truncate
                    font-mono text-sm
                    text-slate-200
                ">
                    {isRoot ? '' : `${movePrefix} `}
                    {moveLabel}
                </span>

                {node.source === 'VARIATION' && (
                    <span className="
                        shrink-0 rounded-md
                        bg-sky-400/10 px-2 py-0.5
                        text-[10px] font-semibold
                        text-sky-300
                    ">
                        Variation
                    </span>
                )}

                {isSelected && (
                    <span className="
                        h-1.5 w-1.5 shrink-0
                        rounded-full bg-emerald-300
                    "/>
                )}
            </button>

            {node.childIds.length > 0 && (
                <div className="
                    ml-4 border-l border-slate-700/70
                    py-1 pl-2
                ">
                    {node.childIds.map((childId) => (
                        <TreeNode
                            key={childId}
                            tree={tree}
                            nodeId={childId}
                            selectedNodeId={selectedNodeId}
                            isAnalyzing={isAnalyzing}
                            onSelectNode={onSelectNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const AnalysisMoveTree: React.FC<AnalysisMoveTreeProps> = ({
                                                                      tree,
                                                                      selectedNodeId,
                                                                      isAnalyzing,
                                                                      onSelectNode,
                                                                  }) => {
    return (
        <aside className="
            flex min-h-[420px] min-w-0
            flex-col overflow-hidden
            rounded-2xl border border-slate-800
            bg-slate-900
        ">
            <div className="
                flex items-center justify-between
                border-b border-slate-800
                px-4 py-4
            ">
                <div>
                    <h2 className="font-semibold text-white">
                        Move tree
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Main line and variations
                    </p>
                </div>

                <span className="
                    rounded-lg bg-slate-800
                    px-2.5 py-1 text-xs
                    font-medium text-slate-300
                ">
                    {Object.keys(tree.nodes).length} positions
                </span>
            </div>

            <div className="
                min-h-0 flex-1
                overflow-y-auto p-3
            ">
                <TreeNode
                    tree={tree}
                    nodeId={tree.rootNodeId}
                    selectedNodeId={selectedNodeId}
                    isAnalyzing={isAnalyzing}
                    onSelectNode={onSelectNode}
                />
            </div>

            <div className="
                border-t border-slate-800
                px-4 py-3
            ">
                <div className="flex flex-wrap gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="
                            h-2 w-2 rounded-full
                            bg-emerald-300
                        "/>
                        Selected position
                    </span>

                    <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="
                            h-2 w-2 rounded-full
                            bg-sky-300
                        "/>
                        Variation
                    </span>
                </div>
            </div>
        </aside>
    );
};