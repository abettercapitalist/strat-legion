import type { WorkflowRFNode, WorkflowRFEdge } from './types';
import type { BrickCategory, CollectionField } from '@/lib/bricks/types';
import { BRICK_OUTPUT_SCHEMAS, type UpstreamOutput, type BrickOutputField } from './outputSchemas';

export interface FieldFlowEntry {
  field: BrickOutputField;
  producedBy: {
    nodeId: string;
    nodeLabel: string;
    brickCategory: BrickCategory;
  } | null;
  deliveredTo: {
    nodeId: string;
    nodeLabel: string;
    brickCategory: BrickCategory;
  }[];
}

export interface FieldDataFlow {
  nodeLabel: string;
  brickCategory: BrickCategory;
  fields: FieldFlowEntry[];
  receives: UpstreamOutput[];
}

/**
 * Find the immediate upstream nodes (direct parents) for a given node.
 */
export function getImmediateUpstream(
  nodeId: string,
  nodes: WorkflowRFNode[],
  edges: WorkflowRFEdge[],
): WorkflowRFNode[] {
  const sourceIds = edges
    .filter((e) => e.target === nodeId)
    .map((e) => e.source);
  return nodes.filter((n) => sourceIds.includes(n.id));
}

/**
 * BFS backwards through the edge list to find all ancestor nodes.
 * Returns nodes in topological order (closest ancestors first).
 * Visited set prevents cycles.
 */
export function getAllUpstream(
  nodeId: string,
  nodes: WorkflowRFNode[],
  edges: WorkflowRFEdge[],
): WorkflowRFNode[] {
  const visited = new Set<string>();
  const result: WorkflowRFNode[] = [];
  const queue: string[] = [nodeId];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const sourceIds = edges
      .filter((e) => e.target === current)
      .map((e) => e.source);

    for (const sourceId of sourceIds) {
      if (visited.has(sourceId)) continue;
      visited.add(sourceId);
      const sourceNode = nodeMap.get(sourceId);
      if (sourceNode) {
        result.push(sourceNode);
        queue.push(sourceId);
      }
    }
  }

  return result;
}

/**
 * Get all available upstream outputs for a node.
 * For each upstream ancestor, returns the static output schema plus
 * dynamic fields for collection bricks.
 */
export function getAvailableUpstreamOutputs(
  nodeId: string,
  nodes: WorkflowRFNode[],
  edges: WorkflowRFEdge[],
): UpstreamOutput[] {
  const upstream = getAllUpstream(nodeId, nodes, edges);

  return upstream.map((node) => {
    const category = node.data.brickCategory;
    const staticFields = BRICK_OUTPUT_SCHEMAS[category] || [];

    // For collection bricks, add dynamic fields from config
    let dynamicFields: BrickOutputField[] = [];
    if (category === 'collection') {
      const configFields = (node.data.config.fields as CollectionField[]) || [];
      dynamicFields = configFields
        .filter((f) => f.name && f.label)
        .map((f) => ({
          name: f.name,
          type: 'any' as const,
          description: `Collected field: ${f.label}`,
        }));
    }

    return {
      nodeId: node.id,
      nodeLabel: node.data.label,
      brickCategory: category,
      fields: [...staticFields, ...dynamicFields],
    };
  });
}

/**
 * BFS backwards from a node, stopping at documentation bricks on each path.
 * Returns only the "nearest" documentation bricks — ones with no intervening
 * doc brick between them and the target node.
 */
export function getNearestUpstreamDocuments(
  nodeId: string,
  nodes: WorkflowRFNode[],
  edges: WorkflowRFEdge[],
): UpstreamOutput[] {
  const visited = new Set<string>();
  const result: WorkflowRFNode[] = [];
  const queue: string[] = [nodeId];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const sourceIds = edges
      .filter((e) => e.target === current)
      .map((e) => e.source);

    for (const sourceId of sourceIds) {
      if (visited.has(sourceId)) continue;
      visited.add(sourceId);
      const sourceNode = nodeMap.get(sourceId);
      if (!sourceNode) continue;

      if (sourceNode.data.brickCategory === 'documentation') {
        // Found a doc brick — add to result, stop traversing this path
        result.push(sourceNode);
      } else {
        // Not a doc brick — continue traversing backwards
        queue.push(sourceId);
      }
    }
  }

  return result.map((node) => {
    const category = node.data.brickCategory;
    const staticFields = BRICK_OUTPUT_SCHEMAS[category] || [];

    return {
      nodeId: node.id,
      nodeLabel: node.data.label,
      brickCategory: category,
      fields: [...staticFields],
    };
  });
}

/**
 * Find the immediate downstream nodes (direct children) for a given node.
 */
export function getImmediateDownstream(
  nodeId: string,
  nodes: WorkflowRFNode[],
  edges: WorkflowRFEdge[],
): WorkflowRFNode[] {
  const targetIds = edges
    .filter((e) => e.source === nodeId)
    .map((e) => e.target);
  return nodes.filter((n) => targetIds.includes(n.id));
}

/** Helper: get output fields for a node (static + dynamic collection fields). */
function getNodeOutputFields(node: WorkflowRFNode): BrickOutputField[] {
  const category = node.data.brickCategory;
  const staticFields = BRICK_OUTPUT_SCHEMAS[category] || [];
  let dynamicFields: BrickOutputField[] = [];
  if (category === 'collection') {
    const configFields = (node.data.config.fields as CollectionField[]) || [];
    dynamicFields = configFields
      .filter((f) => f.name && f.label)
      .map((f) => ({
        name: f.name,
        type: 'any' as const,
        description: `Collected field: ${f.label}`,
      }));
  }
  return [...staticFields, ...dynamicFields];
}

/**
 * Build a field-level data flow view for a node.
 * For each field the node outputs, find:
 * - producedBy: the closest upstream ancestor that also outputs a field with the same name
 * - deliveredTo: all immediate downstream nodes
 */
export function getFieldDataFlow(
  nodeId: string,
  nodes: WorkflowRFNode[],
  edges: WorkflowRFEdge[],
): FieldDataFlow | null {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const node = nodeMap.get(nodeId);
  if (!node) return null;

  const outputFields = getNodeOutputFields(node);
  const upstream = getAllUpstream(nodeId, nodes, edges);
  const downstream = getImmediateDownstream(nodeId, nodes, edges);
  const receives = getAvailableUpstreamOutputs(nodeId, nodes, edges);

  const fields: FieldFlowEntry[] = outputFields.map((field) => {
    // Find the closest upstream node that outputs a field with the same name
    let producedBy: FieldFlowEntry['producedBy'] = null;
    for (const ancestor of upstream) {
      const ancestorFields = getNodeOutputFields(ancestor);
      if (ancestorFields.some((f) => f.name === field.name)) {
        producedBy = {
          nodeId: ancestor.id,
          nodeLabel: ancestor.data.label,
          brickCategory: ancestor.data.brickCategory,
        };
        break; // closest ancestor first (BFS order)
      }
    }

    // All immediate downstream nodes receive this node's output
    const deliveredTo: FieldFlowEntry['deliveredTo'] = downstream.map((dn) => ({
      nodeId: dn.id,
      nodeLabel: dn.data.label,
      brickCategory: dn.data.brickCategory,
    }));

    return { field, producedBy, deliveredTo };
  });

  return {
    nodeLabel: node.data.label,
    brickCategory: node.data.brickCategory,
    fields,
    receives,
  };
}
