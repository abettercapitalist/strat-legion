import { useCallback } from 'react';
import type { WorkflowRFNode, WorkflowRFEdge } from '../types';

export interface WorkflowValidationError {
  id: string;
  nodeId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export function useWorkflowValidation() {
  const validate = useCallback(
    (nodes: WorkflowRFNode[], edges: WorkflowRFEdge[]): WorkflowValidationError[] => {
      const errors: WorkflowValidationError[] = [];

      if (nodes.length === 0) {
        errors.push({ id: 'empty', message: 'Workflow has no nodes. Add at least one brick.', severity: 'error' });
        return errors;
      }

      // Check for at least one entry node (no incoming edges)
      const nodesWithIncoming = new Set(edges.map((e) => e.target));
      const entryNodes = nodes.filter((n) => !nodesWithIncoming.has(n.id));
      if (entryNodes.length === 0) {
        errors.push({ id: 'no-entry', message: 'Workflow has no entry node. At least one node must have no incoming edges.', severity: 'error' });
      }

      // Check for disconnected nodes (no incoming AND no outgoing edges)
      const nodesWithOutgoing = new Set(edges.map((e) => e.source));
      for (const node of nodes) {
        const hasIncoming = nodesWithIncoming.has(node.id);
        const hasOutgoing = nodesWithOutgoing.has(node.id);
        if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
          errors.push({
            id: `disconnected-${node.id}`,
            nodeId: node.id,
            message: `"${node.data.label}" is disconnected from the workflow.`,
            severity: 'warning',
          });
        }
      }

      // Check for cycles using DFS
      const hasCycle = detectCycle(nodes, edges);
      if (hasCycle) {
        errors.push({ id: 'cycle', message: 'Workflow contains a cycle. DAG workflows must be acyclic.', severity: 'error' });
      }

      // Check all nodes are reachable from entry nodes
      const reachable = getReachableNodes(entryNodes.map((n) => n.id), edges);
      for (const node of nodes) {
        if (!reachable.has(node.id) && entryNodes.length > 0) {
          errors.push({
            id: `unreachable-${node.id}`,
            nodeId: node.id,
            message: `"${node.data.label}" is not reachable from any entry node.`,
            severity: 'warning',
          });
        }
      }

      return errors;
    },
    []
  );

  return { validate };
}

function detectCycle(nodes: WorkflowRFNode[], edges: WorkflowRFEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

function getReachableNodes(startIds: string[], edges: WorkflowRFEdge[]): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push(edge.target);
  }

  const visited = new Set<string>();
  const queue = [...startIds];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const neighbor of adjacency.get(current) || []) {
      if (!visited.has(neighbor)) queue.push(neighbor);
    }
  }

  return visited;
}
