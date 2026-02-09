import type { Node, Edge } from '@xyflow/react';
import type { BrickCategory, WorkflowEdgeType } from '@/lib/bricks/types';

// React Flow node data — every node is a brick
export interface WorkflowNodeData {
  dbId: string | null;
  brickId: string;
  brickCategory: BrickCategory;
  config: Record<string, unknown>;
  label: string;
  isValid: boolean;
  validationErrors: string[];
  [key: string]: unknown;
}

export type WorkflowRFNode = Node<WorkflowNodeData, 'brick'>;

// Edge data
export interface WorkflowEdgeData {
  dbId: string | null;
  edgeType: WorkflowEdgeType;
  condition: Record<string, unknown> | null;
  label: string | null;
  [key: string]: unknown;
}

export type WorkflowRFEdge = Edge<WorkflowEdgeData>;

// Palette item for dragging onto canvas
export interface PaletteItem {
  brickCategory: BrickCategory;
  label: string;
  description: string;
  icon: string;
}

// Persisted workflow state for save/load
export interface WorkflowDAGState {
  playId: string;
  playbookId: string;
  nodes: WorkflowRFNode[];
  edges: WorkflowRFEdge[];
}
