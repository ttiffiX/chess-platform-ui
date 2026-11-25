import type {
    AnalysisNode,
    AnalysisTree,
} from '../types/tree';

export interface AnalysisMoveLineItem {
    node: AnalysisNode;
    variations: AnalysisMoveLine[];
}

export type AnalysisMoveLine = AnalysisMoveLineItem[];

export const buildAnalysisMoveLine = (
    tree: AnalysisTree,
    firstNodeId: string,
    includeAlternativesAtFirst = true,
): AnalysisMoveLine => {
    const line: AnalysisMoveLine = [];
    const visited = new Set<string>();

    let current: AnalysisNode | undefined =
        tree.nodes[firstNodeId];

    let parent: AnalysisNode | undefined =
        current?.parentId
            ? tree.nodes[current.parentId]
            : undefined;

    let isFirstNode = true;

    while (current !== undefined && !visited.has(current.id)) {
        // Giữ reference ổn định trong vòng lặp.
        const currentNode: AnalysisNode = current;

        visited.add(currentNode.id);

        let alternativeIds: string[] = [];

        if (
            parent !== undefined &&
            (!isFirstNode || includeAlternativesAtFirst)
        ) {
            alternativeIds = parent.childIds.filter(
                (childId) => childId !== currentNode.id,
            );
        }

        const variations = alternativeIds.flatMap(
            (alternativeId) => {
                const variationLine = buildAnalysisMoveLine(
                    tree,
                    alternativeId,
                    false,
                );

                return variationLine.length > 0
                    ? [variationLine]
                    : [];
            },
        );

        line.push({
            node: currentNode,
            variations,
        });

        const nextNodeId: string | undefined =
            currentNode.childIds[0];

        const nextNode: AnalysisNode | undefined =
            nextNodeId !== undefined
                ? tree.nodes[nextNodeId]
                : undefined;

        parent = currentNode;
        current = nextNode;

        isFirstNode = false;
    }

    return line;
};