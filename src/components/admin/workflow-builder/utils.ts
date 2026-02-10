import { MarkerType } from '@xyflow/react';
import type { BrickCategory, WorkflowNode, WorkflowEdge, WorkflowEdgeType } from '@/lib/bricks/types';
import { BRICK_CATEGORY_IDS } from '@/lib/bricks/types';
import type { WorkflowRFNode, WorkflowRFEdge, WorkflowNodeData, WorkflowEdgeData } from './types';

// Shared arrow marker
const ARROW_MARKER = { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94a3b8' };

// Node category colors
export const BRICK_COLORS: Record<BrickCategory, { bg: string; border: string; text: string; badge: string; glow: string }> = {
  collection:    { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   glow: '147 197 253' },
  review:        { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700', glow: '252 211 77' },
  approval:      { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700', glow: '134 239 172' },
  documentation: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', glow: '196 181 253' },
  commitment:    { bg: 'bg-rose-50',   border: 'border-rose-300',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700',   glow: '253 164 175' },
};

export const BRICK_ICONS: Record<BrickCategory, string> = {
  collection:    'ClipboardList',
  review:        'Search',
  approval:      'CheckCircle',
  documentation: 'FileText',
  commitment:    'PenTool',
};

export const BRICK_LABELS: Record<BrickCategory, string> = {
  collection:    'Collection',
  review:        'Review',
  approval:      'Approval',
  documentation: 'Documentation',
  commitment:    'Commitment',
};

export const BRICK_DESCRIPTIONS: Record<BrickCategory, string> = {
  collection:    'Gather information and data',
  review:        'Evaluate and assess content',
  approval:      'Make decisions and approve',
  documentation: 'Generate documents',
  commitment:    'Get signatures and commitments',
};

// Edge type styling
export function getEdgeStyle(edgeType: WorkflowEdgeType): { stroke: string; strokeWidth: number; strokeDasharray?: string } {
  switch (edgeType) {
    case 'conditional':
      return { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5' };
    case 'error':
      return { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '3 3' };
    default:
      return { stroke: '#94a3b8', strokeWidth: 2 };
  }
}

// Convert DB WorkflowNode to React Flow node
export function dbNodeToRFNode(dbNode: WorkflowNode): WorkflowRFNode {
  const category = getCategoryFromBrickId(dbNode.brick_id);
  return {
    id: dbNode.id,
    type: 'brick',
    position: { x: dbNode.position_x, y: dbNode.position_y },
    data: {
      dbId: dbNode.id,
      brickId: dbNode.brick_id || '',
      brickCategory: category,
      config: dbNode.config || {},
      label: (dbNode.metadata?.label as string) || BRICK_LABELS[category] || 'Brick',
      isValid: true,
      validationErrors: [],
    },
  };
}

// Convert React Flow node to DB WorkflowNode fields for upsert
export function rfNodeToDBNode(rfNode: WorkflowRFNode, playId: string): Omit<WorkflowNode, 'created_at'> {
  return {
    id: rfNode.data.dbId || rfNode.id,
    play_id: playId,
    node_type: 'brick',
    brick_id: rfNode.data.brickId || null,
    config: rfNode.data.config,
    position_x: Math.round(rfNode.position.x),
    position_y: Math.round(rfNode.position.y),
    metadata: { label: rfNode.data.label },
  };
}

// Convert DB WorkflowEdge to React Flow edge
export function dbEdgeToRFEdge(dbEdge: WorkflowEdge): WorkflowRFEdge {
  const style = getEdgeStyle(dbEdge.edge_type);
  const meta = (dbEdge.metadata || {}) as Record<string, unknown>;
  const bidirectional = Boolean(meta.bidirectional);
  const markers = getEdgeMarkers(bidirectional);
  return {
    id: dbEdge.id,
    source: dbEdge.source_node_id,
    target: dbEdge.target_node_id,
    sourceHandle: (meta.sourceHandle as string) || undefined,
    targetHandle: (meta.targetHandle as string) || undefined,
    type: dbEdge.edge_type === 'conditional' ? 'conditional' : 'smoothstep',
    animated: dbEdge.edge_type === 'conditional',
    style,
    ...markers,
    data: {
      dbId: dbEdge.id,
      edgeType: dbEdge.edge_type,
      condition: dbEdge.condition,
      label: dbEdge.label,
      bidirectional,
    },
  };
}

// Simple UUID format check (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Convert React Flow edge to DB WorkflowEdge fields for upsert
export function rfEdgeToDBEdge(rfEdge: WorkflowRFEdge, playId: string): Omit<WorkflowEdge, 'created_at'> {
  // Use dbId if available, fall back to rfEdge.id if it's a valid UUID,
  // otherwise generate a new UUID (guards against React Flow's "xy-edge__..." IDs)
  const rawId = rfEdge.data?.dbId || rfEdge.id;
  const id = UUID_RE.test(rawId) ? rawId : generateEdgeId();
  return {
    id,
    play_id: playId,
    source_node_id: rfEdge.source,
    target_node_id: rfEdge.target,
    edge_type: rfEdge.data?.edgeType || 'default',
    condition: rfEdge.data?.condition || null,
    label: rfEdge.data?.label || null,
    metadata: {
      bidirectional: rfEdge.data?.bidirectional || false,
      sourceHandle: rfEdge.sourceHandle || null,
      targetHandle: rfEdge.targetHandle || null,
    },
  };
}

// Get brick category from brick_id using well-known UUIDs
function getCategoryFromBrickId(brickId: string | null): BrickCategory {
  if (!brickId) return 'collection';
  // The brick_id is a category ID in our simplified model
  for (const [category, id] of Object.entries(BRICK_CATEGORY_IDS)) {
    if (id === brickId) return category as BrickCategory;
  }
  return 'collection';
}

// Generate a new node ID (plain UUID for DB compatibility)
export function generateNodeId(): string {
  return crypto.randomUUID();
}

// Generate a new edge ID (plain UUID for DB compatibility)
export function generateEdgeId(): string {
  return crypto.randomUUID();
}

// Create a new RF node from a palette drop
export function createNodeFromDrop(
  brickCategory: BrickCategory,
  position: { x: number; y: number },
): WorkflowRFNode {
  const id = generateNodeId();
  return {
    id,
    type: 'brick',
    position,
    data: {
      dbId: null,
      brickId: BRICK_CATEGORY_IDS[brickCategory],
      brickCategory,
      config: {},
      label: BRICK_LABELS[brickCategory],
      isValid: true,
      validationErrors: [],
    },
  };
}

// Create a new RF edge from a connection
export function createEdgeFromConnection(
  sourceId: string,
  targetId: string,
  edgeType: WorkflowEdgeType = 'default',
  sourceHandle?: string,
  targetHandle?: string,
): WorkflowRFEdge {
  const id = generateEdgeId();
  const style = getEdgeStyle(edgeType);
  return {
    id,
    source: sourceId,
    target: targetId,
    sourceHandle: sourceHandle ?? undefined,
    targetHandle: targetHandle ?? undefined,
    type: edgeType === 'conditional' ? 'conditional' : 'smoothstep',
    animated: edgeType === 'conditional',
    style,
    markerEnd: ARROW_MARKER,
    data: {
      dbId: null,
      edgeType,
      condition: null,
      label: null,
      bidirectional: false,
    },
  };
}

/** Returns marker props for an edge based on its bidirectional flag */
export function getEdgeMarkers(bidirectional: boolean) {
  return bidirectional
    ? { markerStart: ARROW_MARKER, markerEnd: ARROW_MARKER }
    : { markerStart: undefined, markerEnd: ARROW_MARKER };
}

