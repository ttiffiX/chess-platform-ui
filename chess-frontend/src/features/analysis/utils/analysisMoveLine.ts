import type {
    AnalysisNode,
    AnalysisTree,
} from '../types/tree';

export interface AnalysisMoveLineItem {
    node: AnalysisNode;
    variations: AnalysisMoveLine[];
}

export type AnalysisMoveLine = AnalysisMoveLineItem[];

/**
 * Dựng một line bằng cách đi theo childIds[0].
 *
 * Tại mỗi vị trí tiếp diễn, các child còn lại
 * được dựng thành những variation nằm dưới nước đi chính.
 *
 * includeAlternativesAtFirst:
 * - true: lấy cả các nhánh thay thế của nước đầu tiên.
 * - false: bỏ qua sibling của nước đầu tiên vì chúng
 *   đã được hiển thị ở cấp cha.
 */
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

    while (current && !visited.has(current.id)) {
        visited.add(current.id);

        const shouldBuildAlternatives =
            parent !== undefined &&
            (!isFirstNode || includeAlternativesAtFirst);

        const alternativeIds = shouldBuildAlternatives
            ? parent.childIds.filter(
                (childId) => childId !== current.id,
            )
            : [];

        const variations = alternativeIds.flatMap((alternativeId) => {
            const variationLine = buildAnalysisMoveLine(
                tree,
                alternativeId,
                false,
            );

            return variationLine.length > 0
                ? [variationLine]
                : [];
        });

        line.push({
            node: current,
            variations,
        });

        // Child đầu tiên là nước tiếp diễn của line hiện tại.
        const nextNodeId = current.childIds[0];

        parent = current;

        current = nextNodeId
            ? tree.nodes[nextNodeId]
            : undefined;

        isFirstNode = false;
    }

    return line;
};