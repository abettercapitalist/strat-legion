import { useCallback } from 'react';
import type { WorkflowRFNode, WorkflowRFEdge } from '../types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const RANK_SEP = 100;
const NODE_SEP = 60;
const MARGIN_X = 40;
const MARGIN_Y = 40;

/**
 * Simple hierarchical (top-to-bottom) DAG layout.
 * Assigns nodes to ranks via longest-path layering, then centers each rank.
 */
function hierarchicalLayout(
  nodes: WorkflowRFNode[],
  edges: WorkflowRFEdge[],
): WorkflowRFNode[] {
  if (nodes.length === 0) return nodes;

  const nodeIds = new Set(nodes.map((n) => n.id));

  // Build adjacency: children and parents
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  for (const id of nodeIds) {
    children.set(id, []);
    parents.set(id, []);
  }
  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      children.get(edge.source)!.push(edge.target);
      parents.get(edge.target)!.push(edge.source);
    }
  }

  // Find entry nodes (no parents)
  const entryNodes = nodes.filter((n) => parents.get(n.id)!.length === 0);

  // Assign ranks via BFS from entry nodes (longest path to get better spacing)
  const rank = new Map<string, number>();
  // Initialize all ranks to 0
  for (const id of nodeIds) rank.set(id, 0);

  // Topological order via Kahn's algorithm
  const inDegree = new Map<string, number>();
  for (const id of nodeIds) inDegree.set(id, parents.get(id)!.length);

  const queue: string[] = [];
  for (const id of nodeIds) {
    if (inDegree.get(id) === 0) queue.push(id);
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topoOrder.push(current);
    for (const child of children.get(current)!) {
      // Longest path: rank of child is max of all parent ranks + 1
      rank.set(child, Math.max(rank.get(child)!, rank.get(current)! + 1));
      const newDeg = inDegree.get(child)! - 1;
      inDegree.set(child, newDeg);
      if (newDeg === 0) queue.push(child);
    }
  }

  // Handle nodes not reached (cycles or disconnected) — put them at rank 0
  for (const id of nodeIds) {
    if (!topoOrder.includes(id)) {
      topoOrder.push(id);
    }
  }

  // Group nodes by rank
  const rankGroups = new Map<number, string[]>();
  for (const id of nodeIds) {
    const r = rank.get(id)!;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(id);
  }

  // Position nodes: each rank is a row, nodes are centered horizontally
  const positionMap = new Map<string, { x: number; y: number }>();

  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
  for (const r of sortedRanks) {
    const group = rankGroups.get(r)!;
    const totalWidth = group.length * NODE_WIDTH + (group.length - 1) * NODE_SEP;
    const startX = MARGIN_X + (totalWidth > 0 ? -totalWidth / 2 : 0);
    const y = MARGIN_Y + r * (NODE_HEIGHT + RANK_SEP);

    for (let i = 0; i < group.length; i++) {
      positionMap.set(group[i], {
        x: startX + i * (NODE_WIDTH + NODE_SEP) + totalWidth / 2,
        y,
      });
    }
  }

  return nodes.map((node) => {
    const pos = positionMap.get(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: { x: pos.x, y: pos.y },
    };
  });
}

export function useAutoLayout() {
  const layoutNodes = useCallback(
    (nodes: WorkflowRFNode[], edges: WorkflowRFEdge[]): WorkflowRFNode[] => {
      return hierarchicalLayout(nodes, edges);
    },
    []
  );

  return { layoutNodes };
}
